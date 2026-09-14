(() => {
  const showWarning = (result) => {
    if (!result || !result.threatDetected || result.riskScore < 60) return;
    if (document.getElementById("innovex-security-warning")) return;

    const banner = document.createElement("div");
    banner.id = "innovex-security-warning";
    banner.setAttribute("role", "alert");
    banner.style.cssText = [
      "position:fixed", "top:0", "left:0", "right:0", "z-index:2147483647",
      "padding:14px 18px", "background:#111827", "color:#fff", "font:600 14px system-ui,sans-serif",
      "box-shadow:0 4px 18px rgba(0,0,0,.25)", "display:flex", "gap:12px", "align-items:center", "justify-content:center"
    ].join(";");
    banner.innerHTML = `<span>⚠️ Innovex Security: ${escapeHtml(result.severity)} risk detected (${Number(result.riskScore)}/100).</span>`;

    const close = document.createElement("button");
    close.textContent = "Dismiss";
    close.style.cssText = "border:0;border-radius:8px;padding:7px 10px;cursor:pointer";
    close.addEventListener("click", () => banner.remove());
    banner.appendChild(close);
    document.documentElement.appendChild(banner);
  };

  const escapeHtml = (value) => String(value ?? "").replace(/[&<>\"']/g, (c) => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", "\"":"&quot;", "'":"&#039;"
  }[c]));

  chrome.runtime.onMessage.addListener((message) => {
    if (message?.type === "SCAN_RESULT") showWarning(message.result);
  });
})();
