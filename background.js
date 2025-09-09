// Persist selections per tab so data survives redirects
// Keys: tabSelections:<tabId> -> Array of element objects

// Cleanup when a tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  const key = `tabSelections:${tabId}`;
  chrome.storage.local.remove(key);
});

// Handle messages from content scripts and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const tabId = sender?.tab?.id;

  // Some messages come from popup without a sender.tab; allow explicit tabId
  const effectiveTabId = message.tabId ?? tabId;

  if (!effectiveTabId) {
    // Cannot proceed without a tab id
    sendResponse?.({ error: 'No tab id available' });
    return true;
  }

  const key = `tabSelections:${effectiveTabId}`;

  if (message.action === 'appendSelection') {
    chrome.storage.local.get(key, (data) => {
      const current = Array.isArray(data[key]) ? data[key] : [];
      const next = [...current, message.data];
      chrome.storage.local.set({ [key]: next }, () => {
        sendResponse({ status: 'ok', count: next.length });
      });
    });
    return true;
  }

  if (message.action === 'getTabSelections') {
    chrome.storage.local.get(key, (data) => {
      const elements = Array.isArray(data[key]) ? data[key] : [];
      sendResponse({ elements, count: elements.length });
    });
    return true;
  }

  if (message.action === 'clearTabSelections') {
    chrome.storage.local.remove(key, () => {
      sendResponse({ status: 'cleared' });
    });
    return true;
  }

  // Fallback legacy handler (kept for compatibility)
  if (message.action === 'saveElements') {
    chrome.storage.local.set({ [key]: message.elements }, () => {
      sendResponse({ status: 'Elements saved' });
    });
    return true;
  }
});
