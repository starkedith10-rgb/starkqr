#!/usr/bin/env node
/**
 * STARK QR - MIT-only Citizen CL-E321 cloud print agent.
 * Node.js 20+; built-in modules only. No admin rights or inbound ports.
 */
import net from "node:net";
import os from "node:os";

const QUEUE_URL = process.env.STARK_PRINT_QUEUE_URL;
const QUEUE_TOKEN = process.env.STARK_PRINT_QUEUE_TOKEN;
const PRINTER_HOST = process.env.STARK_PRINTER_HOST || "10.96.64.93";
const PRINTER_PORT = Number(process.env.STARK_PRINTER_PORT || 9100);
const POLL_MS = Math.max(1000, Number(process.env.STARK_PRINT_POLL_MS || 2500));
const AGENT_ID = process.env.STARK_PRINT_AGENT_NAME || ("MIT-PRINT-" + os.hostname());

if (!QUEUE_URL || !QUEUE_TOKEN) {
  console.error("Missing STARK_PRINT_QUEUE_URL or STARK_PRINT_QUEUE_TOKEN in .env");
  process.exit(1);
}
if (!Number.isInteger(PRINTER_PORT) || PRINTER_PORT < 1 || PRINTER_PORT > 65535) {
  console.error("STARK_PRINTER_PORT must be a valid TCP port.");
  process.exit(1);
}
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

async function queueRequest(action, extra = {}) {
  const response = await fetch(QUEUE_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token: QUEUE_TOKEN, action, ...extra }),
    redirect: "follow",
    signal: AbortSignal.timeout(20000)
  });
  const text = await response.text();
  let result;
  try { result = JSON.parse(text); }
  catch { throw new Error("Queue returned non-JSON response (HTTP " + response.status + ")."); }
  if (!response.ok || result.success !== true) {
    throw new Error(result.error || ("Queue request failed (HTTP " + response.status + ")."));
  }
  return result;
}

function sendRawToPrinter(payload) {
  if (typeof payload !== "string" || !payload.length) {
    return Promise.reject(new Error("The queued DPL payload is empty."));
  }
  if (!payload.startsWith("\x02m\r\x02L\r") || !payload.includes("\rQ0001\rE\r")) {
    return Promise.reject(new Error("Rejected job: payload is not the expected one-label MIT DPL format."));
  }
  const bytes = Buffer.from(payload, "latin1");
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host: PRINTER_HOST, port: PRINTER_PORT });
    let settled = false;
    const finish = err => {
      if (settled) return;
      settled = true;
      socket.destroy();
      if (err) reject(err); else resolve();
    };
    socket.setTimeout(15000);
    socket.once("connect", () => {
      socket.write(bytes, err => {
        if (err) return finish(err);
        socket.end();
      });
    });
    socket.once("timeout", () => finish(new Error("Printer TCP connection/write timed out.")));
    socket.once("error", err => finish(err));
    socket.once("close", hadError => {
      if (!settled && !hadError) finish();
      else if (!settled) finish(new Error("Printer connection closed before completion."));
    });
  });
}

async function processJob(job) {
  const jobId = String(job.jobId || "");
  try {
    if (String(job.format || "").toUpperCase() !== "DPL") {
      throw new Error("Unsupported queue format: " + (job.format || "missing") +
        ". This agent prints DPL only; no data was sent to the printer.");
    }
    await sendRawToPrinter(job.payload);
    await queueRequest("COMPLETE", { jobId, status: "PRINTED" });
    console.log("[" + new Date().toLocaleString() + "] Sent job " + jobId +
      " to " + PRINTER_HOST + ":" + PRINTER_PORT + "; queue marked PRINTED.");
  } catch (err) {
    const message = err && err.message ? err.message : String(err);
    console.error("Job " + jobId + " failed: " + message);
    try {
      await queueRequest("COMPLETE", { jobId, status: "FAILED", error: message });
      console.error("Queue marked job " + jobId + " FAILED.");
    } catch (completeErr) {
      console.error("Could not report failure for " + jobId + ": " + completeErr.message);
      console.error("The queue may leave this job in PRINTING; inspect it before retrying to avoid duplicates.");
    }
  }
}

console.log("STARK QR MIT Print Agent started.");
console.log("Agent: " + AGENT_ID);
console.log("Printer: " + PRINTER_HOST + ":" + PRINTER_PORT);
console.log("Mode: outbound HTTPS polling; no internet-facing printer port.");

let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => { stopping = true; console.log("Stopping after current operation..."); });
}
while (!stopping) {
  try {
    const result = await queueRequest("POLL", { agent: AGENT_ID });
    if (result.jobAvailable && result.job) await processJob(result.job);
    else await sleep(POLL_MS);
  } catch (err) {
    console.error("Queue poll error: " + err.message);
    await sleep(Math.max(POLL_MS, 5000));
  }
}
console.log("MIT Print Agent stopped.");
