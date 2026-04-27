export async function handler(event) {
  try {
    // Only allow POST
    if (event.httpMethod !== "POST") {
      return {
        statusCode: 405,
        body: JSON.stringify({ error: "Method not allowed" })
      };
    }

    const data = JSON.parse(event.body || "{}");

    if (!data.message) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing message" })
      };
    }

    console.log("📦 PRINT JOB RECEIVED:", data.message);

    // IMPORTANT:
    // Netlify cannot access your local printer directly.
    // So we only ACK (confirm receipt) here.

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: data.message
      })
    };

  } catch (err) {
    console.error("FUNCTION ERROR:", err);

    return {
      statusCode: 500,
      body: JSON.stringify({
        error: err.message
      })
    };
  }
}
