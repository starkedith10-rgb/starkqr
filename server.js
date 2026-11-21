import express from "express";

const app = express();
const PORT = Number(process.env.PORT) || 3000;
const BOT_TOKEN = process.env.BOT_TOKEN;
const CHAT_ID = process.env.CHAT_ID;

// Set ALLOWED_ORIGIN in Render to the exact URL of your Render Static Site.
const allowedOrigins = (process.env.ALLOWED_ORIGIN || "")
  .split(",")
  .map((origin) => origin.trim())
  .filter(Boolean);

app.disable("x-powered-by");
app.use(express.json({ limit: "8kb" }));

app.use((req, res, next) => {
  const origin = req.headers.origin;

  if (origin && allowedOrigins.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Vary", "Origin");
    res.setHeader("Access-Control-Allow-Methods", "GET, POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  }

  if (req.method === "OPTIONS") {
    return res.sendStatus(origin && allowedOrigins.includes(origin) ? 204 : 403);
  }

  if (origin && !allowedOrigins.includes(origin)) {
    return res.status(403).json({ success: false, error: "Origin not allowed" });
  }

  next();
});

app.get("/", (_req, res) => {
  res.json({ success: true, service: "STARK QR Telegram API" });
});

app.post("/api/log", async (req, res) => {
  try {
    const message = String(req.body?.message || "").trim();

    if (!message) {
      return res.status(400).json({ success: false, error: "No message provided" });
    }

    if (message.length > 4096) {
      return res.status(413).json({
        success: false,
        error: "Telegram message exceeds 4096 characters"
      });
    }

    if (!BOT_TOKEN || !CHAT_ID) {
      return res.status(500).json({
        success: false,
        error: "Telegram environment variables are not configured"
      });
    }

    const telegramResponse = await fetch(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: CHAT_ID, text: message })
      }
    );

    const telegramData = await telegramResponse.json();

    if (!telegramResponse.ok || !telegramData.ok) {
      return res.status(502).json({
        success: false,
        error: telegramData.description || "Telegram delivery failed"
      });
    }

    return res.json({ success: true });
  } catch (error) {
    console.error("Telegram log error:", error.message);
    return res.status(500).json({ success: false, error: "Unable to send Telegram message" });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`STARK QR Telegram API listening on port ${PORT}`);
});
