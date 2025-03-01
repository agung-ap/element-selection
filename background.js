// Initialize extension state when installed
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({
      isSelectionMode: false,
      selectedElements: []
    });
  });
  
  // Listen for tab changes to reset selection mode if needed
  chrome.tabs.onActivated.addListener((activeInfo) => {
    chrome.storage.local.get('isSelectionMode', (data) => {
      if (data.isSelectionMode) {
        // Reset selection mode when changing tabs
        chrome.storage.local.set({ isSelectionMode: false });
      }
    });
  });
  
  // Handle messages from content scripts and popup
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'saveElements') {
      // Save selected elements to storage
      chrome.storage.local.set({ selectedElements: message.elements }, () => {
        sendResponse({ status: 'Elements saved' });
      });
      return true;
    }
  });