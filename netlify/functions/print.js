export async function handler(event) {
  try {
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, error: "Method not allowed" })
      };
    }

    let data;
    try {
      data = JSON.parse(event.body || "{}");
    } catch {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, error: "Invalid JSON request" })
      };
    }

    if (typeof data.message !== "string" || !data.message.trim()) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, error: "Missing print message" })
      };
    }

    const queueUrl = process.env.STARK_PRINT_QUEUE_URL;
    const queueToken = process.env.STARK_PRINT_QUEUE_TOKEN;

    if (!queueUrl || !queueToken) {
      console.error("MIT print queue environment variables are missing");
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, error: "MIT print queue is not configured" })
      };
    }

    const queueResponse = await fetch(queueUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        token: queueToken,
        action: "ENQUEUE",
        format: "TSPL",
        payload: data.message
      }),
      redirect: "follow"
    });

    const responseText = await queueResponse.text();
    let queueResult;
    try {
      queueResult = JSON.parse(responseText);
    } catch {
      console.error("Unexpected response from MIT queue:", responseText.slice(0, 500));
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, error: "Unexpected response from Google Apps Script queue" })
      };
    }

    if (!queueResponse.ok || queueResult.success !== true) {
      console.error("MIT queue rejected job:", queueResult.error || queueResponse.status);
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          error: queueResult.error || "Google Apps Script queue rejected the print job"
        })
      };
    }

    console.log("MIT print job queued:", queueResult.jobId);

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        success: true,
        jobId: queueResult.jobId,
        status: queueResult.status || "QUEUED",
        message: queueResult.message || "MIT print job added to queue"
      })
    };
  } catch (err) {
    console.error("MIT PRINT FUNCTION ERROR:", err);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: err.message || "Print queue error" })
    };
  }
}
