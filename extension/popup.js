let currentUrl = "";

const $ = (id) => document.getElementById(id);

function render(result) {
  $("result").hidden = false;
  $("score").textContent = `${result.riskScore}/100`;
  $("severity").textContent = result.severity;
  $("recommendation").textContent = result.recommendation;
  $("indicators").replaceChildren(...(result.indicators || []).map((item) => {
    const li = document.createElement("li");
    li.textContent = item;
    return li;
  }));
}

async function getActiveTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  return tabs[0];
}

async function scan() {
  $("error").hidden = true;
  $("scan").disabled = true;
  $("scan").textContent = "Scanning…";
  try {
    const tab = await getActiveTab();
    if (!tab?.url || !/^https?:/i.test(tab.url)) throw new Error("This page cannot be scanned.");
    currentUrl = tab.url;
    $("url").textContent = currentUrl;

    const response = await chrome.runtime.sendMessage({ type: "SCAN_URL", url: currentUrl });
    if (!response?.ok) throw new Error(response?.error || "Scan failed.");
    render(response.result);
  } catch (error) {
    $("error").hidden = false;
    $("error").textContent = error.message;
  } finally {
    $("scan").disabled = false;
    $("scan").textContent = "Scan current page";
  }
}

$("scan").addEventListener("click", scan);
getActiveTab().then((tab) => {
  currentUrl = tab?.url || "";
  $("url").textContent = currentUrl || "No scannable page";
});
