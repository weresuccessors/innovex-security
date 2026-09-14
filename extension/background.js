const API_BASE_URL = "https://YOUR-INNOVEX-DOMAIN.example";

async function scanUrl(url) {
  const response = await fetch(`${API_BASE_URL}/api/scan/url`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ url })
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok || !data.success) {
    throw new Error(data.error || `Scan failed (${response.status})`);
  }
  return data;
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message?.type !== "SCAN_URL" || typeof message.url !== "string") return;

  scanUrl(message.url)
    .then((result) => {
      chrome.tabs.sendMessage(sender.tab?.id, {
        type: "SCAN_RESULT",
        result
      }).catch(() => {});
      sendResponse({ ok: true, result });
    })
    .catch((error) => sendResponse({ ok: false, error: error.message }));

  return true;
});
