export async function handler(event) {

  try {
    const data = JSON.parse(event.body || "{}");

    console.log("📦 PRINT JOB RECEIVED:", data.message);

    // FORWARD TO LOCAL PRINT AGENT
    await fetch("http://localhost:3001/print", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: data.message
      })
    });

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}
