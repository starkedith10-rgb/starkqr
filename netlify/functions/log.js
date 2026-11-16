exports.handler = async function(event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: "Method Not Allowed" })
    };
  }

  try {
    const body = JSON.parse(event.body || "{}");
    const message = String(body.message || "").trim();

    if (!message) {
      return {
        statusCode: 400,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, error: "No message provided" })
      };
    }

    if (message.length > 4096) {
      return {
        statusCode: 413,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, error: "Telegram message exceeds 4096 characters" })
      };
    }

    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return {
        statusCode: 500,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ success: false, error: "Missing Telegram environment variables" })
      };
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
      return {
        statusCode: 502,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          success: false,
          error: telegramData.description || "Telegram delivery failed"
        })
      };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: true })
    };

  } catch (error) {
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ success: false, error: error.message })
    };
  }
};
