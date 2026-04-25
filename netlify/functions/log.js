export async function handler(event) {

  // Allow only POST requests
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed" })
    };
  }

  try {

    // Parse data from frontend
    const body = JSON.parse(event.body || "{}");
    const message = body.message;

    if (!message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "No message provided" })
      };
    }

    // Secure environment variables (DO NOT expose in frontend)
    const BOT_TOKEN = process.env.BOT_TOKEN;
    const CHAT_ID = process.env.CHAT_ID;

    if (!BOT_TOKEN || !CHAT_ID) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: "Missing environment variables" })
      };
    }

    // Telegram API call
    const url = `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`;

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: CHAT_ID,
        text: message
      })
    });

    const data = await response.json();

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        telegram: data
      })
    };

  } catch (error) {
    return {
      statusCode: 500,
      body: JSON.stringify({
        error: error.message
      })
    };
  }
}