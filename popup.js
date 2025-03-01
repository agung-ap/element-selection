// DOM elements
const startSelectionBtn = document.getElementById('start-selection');
const stopSelectionBtn = document.getElementById('stop-selection');
const clearDataBtn = document.getElementById('clear-data');
const exportCsvBtn = document.getElementById('export-csv');
const statusElement = document.getElementById('status');
const elementCountElement = document.getElementById('element-count');
const dataPreviewContainer = document.getElementById('data-preview-container');

// Global variables
let selectedElements = [];

// Initialize the popup
document.addEventListener('DOMContentLoaded', async () => {
  // Check if selection mode is active
  chrome.storage.local.get('isSelectionMode', (data) => {
    if (data.isSelectionMode) {
      toggleSelectionButtons(true);
      statusElement.textContent = 'Selection Mode Active';
    } else {
      toggleSelectionButtons(false);
      statusElement.textContent = 'Ready';
    }
  });
  
  // Get any previously selected elements and current selection mode state
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      // Ask content script for current state
      chrome.tabs.sendMessage(tabs[0].id, { action: 'getSelectionState' }, (response) => {
        if (response) {
          // Update UI based on current state from content script
          if (response.isSelectionMode !== undefined) {
            toggleSelectionButtons(response.isSelectionMode);
            statusElement.textContent = response.isSelectionMode ? 'Selection Mode Active' : 'Ready';
            
            // Update storage to match content script state
            chrome.storage.local.set({ isSelectionMode: response.isSelectionMode });
          }
          
          // Update selected elements
          if (response.elements) {
            selectedElements = response.elements;
            updateElementCount(selectedElements.length);
            updateDataPreview();
          }
        }
      });
    }
  });
});

// Start selection mode
startSelectionBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'startSelection' }, (response) => {
        if (response && response.status) {
          statusElement.textContent = 'Selection Mode Active';
          toggleSelectionButtons(true);
          
          // Store selection mode state
          chrome.storage.local.set({ isSelectionMode: true });
        }
      });
    }
  });
});

// Stop selection mode
stopSelectionBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'stopSelection' }, (response) => {
        if (response && response.status) {
          statusElement.textContent = 'Ready';
          toggleSelectionButtons(false);
          
          // Store selection mode state
          chrome.storage.local.set({ isSelectionMode: false });
        }
      });
    }
  });
});

// Clear selected data
clearDataBtn.addEventListener('click', () => {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, { action: 'clearData' }, (response) => {
        if (response) {
          selectedElements = [];
          updateElementCount(0);
          dataPreviewContainer.innerHTML = '<p>No data selected yet</p>';
          statusElement.textContent = 'Data Cleared';
        }
      });
    }
  });
});

// Export selected data to CSV
exportCsvBtn.addEventListener('click', () => {
  if (selectedElements.length === 0) {
    statusElement.textContent = 'No data to export';
    return;
  }
  
  // Convert data to CSV
  const csv = convertToCSV(selectedElements);
  
  // Create a Blob and trigger download
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  
  // Create a download link and trigger it
  chrome.downloads.download({
    url: url,
    filename: `web-elements-${new Date().toISOString().split('T')[0]}.csv`,
    saveAs: true
  });
  
  statusElement.textContent = 'Data exported to CSV';
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'elementSelected') {
    // Update the selected elements count
    updateElementCount(message.count);
    
    // Update the array of selected elements
    selectedElements.push(message.data);
    
    // Update the preview
    updateDataPreview();
  } else if (message.action === 'selectionClosed') {
    // Update UI to show selection mode was closed
    statusElement.textContent = 'Ready';
    toggleSelectionButtons(false);
    
    // Store selection mode state
    chrome.storage.local.set({ isSelectionMode: false });
  } else if (message.action === 'selectionToggled') {
    // Update UI to show selection mode was toggled
    statusElement.textContent = message.isActive ? 'Selection Mode Active' : 'Ready';
    toggleSelectionButtons(message.isActive);
    
    // Store selection mode state
    chrome.storage.local.set({ isSelectionMode: message.isActive });
  }
  return true;
});

// Helper function to toggle selection buttons
function toggleSelectionButtons(isSelecting) {
  startSelectionBtn.disabled = isSelecting;
  stopSelectionBtn.disabled = !isSelecting;
}

// Helper function to update element count display
function updateElementCount(count) {
  elementCountElement.textContent = count;
}

// Helper function to update data preview
function updateDataPreview() {
  if (selectedElements.length === 0) {
    dataPreviewContainer.innerHTML = '<p>No data selected yet</p>';
    return;
  }
  
  let previewHTML = '';
  
  // Show the 3 most recent selections
  const recentElements = selectedElements.slice(-3);
  
  recentElements.forEach((element, index) => {
    previewHTML += `
      <div class="preview-item">
        <strong>${index + 1}. ${element.tagName}${element.id ? ' #' + element.id : ''}</strong>
        <div class="preview-content">
          ${element.textContent.substring(0, 50)}${element.textContent.length > 50 ? '...' : ''}
        </div>
      </div>
    `;
  });
  
  dataPreviewContainer.innerHTML = previewHTML;
}

// Helper function to convert data to CSV
function convertToCSV(data) {
  if (data.length === 0) return '';
  
  // Determine CSV headers (using keys from the first object)
  const firstObj = data[0];
  const excludeKeys = ['attributes', 'innerHTML', 'outerHTML']; // Exclude complex objects but keep selectedElement
  const headers = ['tagName', 'id', 'className', 'textContent', 'xpath', 'cssSelector', 'selectedElement', 'timestamp'];
  
  // Create CSV header row
  let csv = headers.join(',') + '\n';
  
  // Add data rows
  data.forEach(item => {
    const row = headers.map(header => {
      // Get the value and escape any commas and quotes
      let value = item[header];
      
      // Convert to string and escape quotes
      value = (value === null || value === undefined) ? '' : String(value);
      value = value.replace(/"/g, '""');
      
      // Wrap in quotes if the value contains commas, quotes, or newlines
      if (value.includes(',') || value.includes('"') || value.includes('\n')) {
        value = `"${value}"`;
      }
      
      return value;
    });
    
    csv += row.join(',') + '\n';
  });
  
  return csv;
}