window.track = async function (eventName) {

  const user = sessionStorage.getItem("wms_user") || "Guest";
  const time = new Date().toLocaleString();

  const message =
`📊 WMS LOG
👤 User: ${user}
📍 Event: ${eventName}
⏰ Time: ${time}`;

  await fetch("/.netlify/functions/log", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ message })
  });

};