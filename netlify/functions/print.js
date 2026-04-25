export async function handler(event) {
  try {
    const data = JSON.parse(event.body || "{}");

    const message = data.message;

    console.log("PRINT REQUEST RECEIVED:");
    console.log(message);

    // Here we just accept request (real printing happens in print service)

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: "Print job queued"
      })
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message })
    };
  }
}