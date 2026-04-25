// 🔒 Prevent duplicate spam (per action + page)
let lastSent = {};

// 🎯 MAIN TRACK FUNCTION
window.track = async function(action) {

  try {

    let user = sessionStorage.getItem("wms_user") || "UNKNOWN";
    let page = window.location.pathname.split("/").pop() || "index.html";

    let key = action + "_" + page;

    // ⛔ Prevent duplicate within 5 seconds
    if (lastSent[key] && Date.now() - lastSent[key] < 5000) {
      return;
    }

    lastSent[key] = Date.now();

    let message = 
`📌 ACTION: ${action}
👤 USER: ${user}
📄 PAGE: ${page}
⏰ TIME: ${new Date().toLocaleString()}`;

    await fetch("/.netlify/functions/log", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ message })
    });

  } catch (err) {
    console.log("Tracking error:", err);
  }

};



// 🚀 TRACK PAGE LOAD (only once per page)
window.trackPage = function(action) {

  let pageKey = "tracked_" + window.location.pathname;

  if (!sessionStorage.getItem(pageKey)) {
    track(action);
    sessionStorage.setItem(pageKey, "yes");
  }

};
