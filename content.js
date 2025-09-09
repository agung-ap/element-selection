// Toggle between selection modes
function toggleSelectionMode() {
  const toggleButton = document.getElementById('toggle-selection-button');
  const statusLabel = document.getElementById('selection-status');
  
  if (isSelectionMode) {
    // Currently in selection mode, switch to inactive
    isSelectionMode = false;
    
    // Update button
    if (toggleButton) {
      toggleButton.textContent = 'Start Selection';
      toggleButton.style.backgroundColor = '#34a853'; // Green color for start
    }
    
    // Update status
    if (statusLabel) {
      statusLabel.textContent = 'Selection Mode Inactive';
      statusLabel.style.color = '#5f6368'; // Gray color for inactive
    }
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('click', handleClick, true);
    
    // Remove highlight overlay
    if (highlightOverlay) {
      document.body.removeChild(highlightOverlay);
      highlightOverlay = null;
    }
    
    // Reset cursor
    document.body.style.cursor = 'default';
    
    // Notify popup that selection mode was toggled
    chrome.runtime.sendMessage({
      action: 'selectionToggled',
      isActive: false
    });
  } else {
    // Currently inactive, switch to selection mode
    isSelectionMode = true;
    
    // Update button
    if (toggleButton) {
      toggleButton.textContent = 'Stop Selection';
      toggleButton.style.backgroundColor = '#ea4335'; // Red color for stop
    }
    
    // Update status
    if (statusLabel) {
      statusLabel.textContent = 'Selection Mode Active';
      statusLabel.style.color = '#34a853'; // Green color for active
    }
    
    // Create overlay for highlighting elements
    createHighlightOverlay();
    
    // Add event listeners for hovering and clicking
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('click', handleClick, true);
    
    // Change cursor to indicate selection mode
    document.body.style.cursor = 'crosshair';
    
    // Notify popup that selection mode was toggled
    chrome.runtime.sendMessage({
      action: 'selectionToggled',
      isActive: true
    });
  }
}let isSelectionMode = false;
let selectedElements = [];
let highlightedElement = null;
let highlightOverlay = null;
let navbarElement = null;

// Persistence helpers: store selections per tab via background
function appendSelectionToBackground(elementData, cb) {
  try {
    chrome.runtime.sendMessage({ action: 'appendSelection', data: elementData }, (resp) => {
      if (typeof cb === 'function') cb(resp);
    });
  } catch (_) { if (typeof cb === 'function') cb(); }
}

function loadSelectionsFromBackground(callback) {
  try {
    chrome.runtime.sendMessage({ action: 'getTabSelections' }, (resp) => {
      const saved = resp && Array.isArray(resp.elements) ? resp.elements : [];
      selectedElements = saved;
      if (typeof callback === 'function') callback(selectedElements);
    });
  } catch (_) {
    if (typeof callback === 'function') callback(selectedElements);
  }
}

// Listen for messages from the popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'startSelection') {
    startSelectionMode();
    sendResponse({ status: 'Selection mode started' });
  } else if (message.action === 'stopSelection') {
    stopSelectionMode();
    sendResponse({ status: 'Selection mode stopped' });
  } else if (message.action === 'getSelectedElements') {
    sendResponse({ elements: selectedElements });
  } else if (message.action === 'clearData') {
    selectedElements = [];
    // Clear persisted selections for this tab in background
    try { chrome.runtime.sendMessage({ action: 'clearTabSelections' }); } catch (_) {}
    // Update the navbar counter if it exists
    if (window.updateElementCounter) {
      window.updateElementCounter(0);
    }
    sendResponse({ status: 'Data cleared', count: 0 });
  } else if (message.action === 'getSelectionState') {
    // Ensure we return persisted data even on fresh loads
    if (!Array.isArray(selectedElements) || selectedElements.length === 0) {
      loadSelectionsFromBackground(() => {
        sendResponse({ 
          isSelectionMode: isSelectionMode,
          elements: selectedElements
        });
      });
    } else {
      sendResponse({ 
        isSelectionMode: isSelectionMode,
        elements: selectedElements
      });
    }
  }
  return true;
});

// Create a floating navbar for selection controls
function createNavbar() {
  // Create main navbar container
  navbarElement = document.createElement('div');
  navbarElement.style.position = 'fixed';
  navbarElement.style.top = '10px';
  navbarElement.style.left = '50%';
  navbarElement.style.transform = 'translateX(-50%)';
  navbarElement.style.zIndex = '10001';
  navbarElement.style.backgroundColor = '#f8f9fa';
  navbarElement.style.boxShadow = '0 2px 10px rgba(0, 0, 0, 0.2)';
  navbarElement.style.borderRadius = '4px';
  navbarElement.style.padding = '8px 16px';
  navbarElement.style.display = 'flex';
  navbarElement.style.alignItems = 'center';
  navbarElement.style.gap = '12px';
  navbarElement.style.fontFamily = 'Arial, sans-serif';
  navbarElement.style.fontSize = '14px';
  
  // Add status label
  const statusLabel = document.createElement('span');
  statusLabel.textContent = 'Selection Mode Active';
  statusLabel.id = 'selection-status';
  statusLabel.style.fontWeight = 'bold';
  statusLabel.style.color = '#34a853';
  navbarElement.appendChild(statusLabel);
  
  // Add counter for selected elements
  const counterElement = document.createElement('span');
  counterElement.textContent = `Selected: ${selectedElements.length}`;
  counterElement.id = 'element-counter';
  counterElement.style.marginLeft = 'auto';
  counterElement.style.marginRight = '10px';
  navbarElement.appendChild(counterElement);
  
  // Add hint for shift key
  const shiftHint = document.createElement('span');
  shiftHint.textContent = 'Hold SHIFT to highlight & click to select';
  shiftHint.style.fontSize = '12px';
  shiftHint.style.color = '#5f6368';
  shiftHint.style.marginRight = '10px';
  navbarElement.appendChild(shiftHint);
  
  // Add toggle button
  const toggleButton = document.createElement('button');
  toggleButton.textContent = 'Stop Selection';
  toggleButton.id = 'toggle-selection-button';
  toggleButton.style.backgroundColor = '#ea4335';
  toggleButton.style.color = 'white';
  toggleButton.style.border = 'none';
  toggleButton.style.borderRadius = '4px';
  toggleButton.style.padding = '6px 12px';
  toggleButton.style.cursor = 'pointer';
  toggleButton.style.fontWeight = 'bold';
  navbarElement.appendChild(toggleButton);
  
  // Add close button
  const closeButton = document.createElement('button');
  closeButton.textContent = '✕';
  closeButton.id = 'close-selection-button';
  closeButton.style.backgroundColor = '#5f6368';
  closeButton.style.color = 'white';
  closeButton.style.border = 'none';
  closeButton.style.borderRadius = '4px';
  closeButton.style.padding = '6px 12px';
  closeButton.style.cursor = 'pointer';
  closeButton.style.fontWeight = 'bold';
  navbarElement.appendChild(closeButton);
  
  // Add to document
  document.body.appendChild(navbarElement);
  
  // Add event listeners AFTER the navbar is in the DOM
  document.getElementById('toggle-selection-button').onclick = function(event) {
    event.preventDefault();
    event.stopPropagation();
    
    if (isSelectionMode) {
      // Stop selection mode
      isSelectionMode = false;
      
      // Remove text selection prevention
      document.body.classList.remove('web-element-selector-active');
      
      // Sync with storage
      chrome.storage.local.set({ isSelectionMode: false });
      
      // Update UI
      this.textContent = 'Start Selection';
      this.style.backgroundColor = '#34a853'; // Green for start
      document.getElementById('selection-status').textContent = 'Selection Mode Inactive';
      document.getElementById('selection-status').style.color = '#5f6368';
      
      // Remove event listeners
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('click', handleClick, true);
      
      // Remove highlight overlay
      if (highlightOverlay && highlightOverlay.parentNode) {
        highlightOverlay.parentNode.removeChild(highlightOverlay);
        highlightOverlay = null;
      }
      
      // Reset cursor
      document.body.style.cursor = 'default';
      
      // Notify popup to update its UI
      chrome.runtime.sendMessage({
        action: 'selectionToggled',
        isActive: false
      });
      
    } else {
      // Start selection mode
      isSelectionMode = true;
      
      // Activate text selection prevention
      document.body.classList.add('web-element-selector-active');
      
      // Sync with storage
      chrome.storage.local.set({ isSelectionMode: true });
      
      // Update UI
      this.textContent = 'Stop Selection';
      this.style.backgroundColor = '#ea4335'; // Red for stop
      document.getElementById('selection-status').textContent = 'Selection Mode Active';
      document.getElementById('selection-status').style.color = '#34a853';
      
      // Create highlight overlay
      createHighlightOverlay();
      
      // Add event listeners
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('click', handleClick, true);
      
      // Change cursor
      document.body.style.cursor = 'crosshair';
      
      // Notify popup to update its UI
      chrome.runtime.sendMessage({
        action: 'selectionToggled',
        isActive: true
      });
    }
    
    return false;
  };
  
  document.getElementById('close-selection-button').onclick = function(event) {
    event.preventDefault();
    event.stopPropagation();
    
    // Disable selection mode
    isSelectionMode = false;
    
    // Remove text selection prevention
    document.body.classList.remove('web-element-selector-active');
    
    // Remove event listeners
    document.removeEventListener('mousemove', handleMouseMove);
    document.removeEventListener('click', handleClick, true);
    
    // Remove highlight overlay
    if (highlightOverlay && highlightOverlay.parentNode) {
      highlightOverlay.parentNode.removeChild(highlightOverlay);
      highlightOverlay = null;
    }
    
    // Remove navbar
    if (navbarElement && navbarElement.parentNode) {
      navbarElement.parentNode.removeChild(navbarElement);
      navbarElement = null;
    }
    
    // Reset cursor
    document.body.style.cursor = 'default';
    
    // Notify popup
    chrome.runtime.sendMessage({
      action: 'selectionClosed'
    });
    
    return false;
  };
  
  // Update the counter function
  window.updateElementCounter = function(count) {
    const counterElement = document.getElementById('element-counter');
    if (counterElement) {
      counterElement.textContent = `Selected: ${count}`;
    }
  };
}

// Start the element selection mode
function startSelectionMode() {
  // Update state first
  isSelectionMode = true;
  
  // Activate text selection prevention
  document.body.classList.add('web-element-selector-active');
  
  // Sync with storage
  chrome.storage.local.set({ isSelectionMode: true });
  
  // Create navbar if it doesn't exist
  if (!navbarElement) {
    createNavbar();
  } else {
    // Update existing navbar UI
    const toggleButton = document.getElementById('toggle-selection-button');
    const statusLabel = document.getElementById('selection-status');
    
    if (toggleButton) {
      toggleButton.textContent = 'Stop Selection';
      toggleButton.style.backgroundColor = '#ea4335'; // Red for stop
    }
    
    if (statusLabel) {
      statusLabel.textContent = 'Selection Mode Active';
      statusLabel.style.color = '#4285f4'; // Blue color for active
    }
  }
  
  // Create highlight overlay if needed
  if (!highlightOverlay) {
    createHighlightOverlay();
  }
  
  // Add event listeners
  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('click', handleClick, true);
  
  // Change cursor
  document.body.style.cursor = 'crosshair';
  // Ensure counter reflects any restored selections
  if (window.updateElementCounter) {
    window.updateElementCounter(Array.isArray(selectedElements) ? selectedElements.length : 0);
  }
  
  // Notify popup
  chrome.runtime.sendMessage({
    action: 'selectionToggled',
    isActive: true
  });
}

// Stop the element selection mode
function stopSelectionMode() {
  // Instead of removing the navbar, we'll just toggle its state
  toggleSelectionMode();
}

// Create a highlight overlay for the elements
function createHighlightOverlay() {
  // First create and add style to prevent text selection
  if (!document.getElementById('web-element-selector-style')) {
    const styleElement = document.createElement('style');
    styleElement.id = 'web-element-selector-style';
    styleElement.textContent = `
      .web-element-selector-active {
        user-select: none !important;
        -webkit-user-select: none !important;
        -moz-user-select: none !important;
        -ms-user-select: none !important;
      }
    `;
    document.head.appendChild(styleElement);
  }

  highlightOverlay = document.createElement('div');
  highlightOverlay.style.position = 'fixed';
  highlightOverlay.style.pointerEvents = 'none';
  highlightOverlay.style.border = '2px solid #34a853';
  highlightOverlay.style.backgroundColor = 'rgba(52, 168, 83, 0.2)';
  highlightOverlay.style.zIndex = '10000';
  highlightOverlay.style.display = 'none'; // Initially hidden
  document.body.appendChild(highlightOverlay);
}

// Handle mouse movement to highlight elements
function handleMouseMove(event) {
  if (!isSelectionMode) return;
  
  // Only show highlight when the shift key is pressed
  if (!event.shiftKey) {
    if (highlightOverlay && highlightOverlay.style.display !== 'none') {
      highlightOverlay.style.display = 'none';
    }
    return;
  }
  
  // Get the element under the cursor
  const element = document.elementFromPoint(event.clientX, event.clientY);
  
  if (element && element !== highlightedElement) {
    highlightedElement = element;
    
    // Position the highlight overlay
    const rect = element.getBoundingClientRect();
    highlightOverlay.style.display = 'block';
    highlightOverlay.style.top = rect.top + 'px';
    highlightOverlay.style.left = rect.left + 'px';
    highlightOverlay.style.width = rect.width + 'px';
    highlightOverlay.style.height = rect.height + 'px';
  }
}

// Handle element selection on click
function handleClick(event) {
  if (!isSelectionMode) return;
  
  // Check if the click is on our navbar or its children
  let target = event.target;
  while (target) {
    if (target === navbarElement || 
        target.id === 'toggle-selection-button' || 
        target.id === 'close-selection-button') {
      // Let the navbar buttons handle their own events
      return;
    }
    target = target.parentNode;
  }
  
  // Only proceed with selection if shift key is pressed
  if (!event.shiftKey) {
    return;
  }
  
  // Prevent text selection
  event.preventDefault();
  event.stopPropagation();
  
  // Get the element that was clicked
  const element = document.elementFromPoint(event.clientX, event.clientY);
  
  // Don't select our own UI elements
  if (element === highlightOverlay) {
    return;
  }
  
  if (element) {
    // Extract element data
    const elementData = extractElementData(element);

    // Add to selected elements array
    selectedElements.push(elementData);
    // Persist in background so redirects keep selections
    appendSelectionToBackground(elementData);
    
    // Update the counter in the navbar
    if (window.updateElementCounter) {
      window.updateElementCounter(selectedElements.length);
    }
    
    // Notify the popup about the new selection
    chrome.runtime.sendMessage({
      action: 'elementSelected',
      data: elementData,
      count: selectedElements.length
    });
    
    // Provide visual feedback that the element was selected
    flashElement(element);
  }
}

// Extract relevant data from the selected element
function extractElementData(element) {
  // Get element's XPath
  const xpath = getElementXPath(element);
  
  // Get CSS selector
  const cssSelector = getElementCSSSelector(element);
  
  // Get element attributes
  const attributes = {};
  for (const attr of element.attributes) {
    attributes[attr.name] = attr.value;
  }
  
  return {
    tagName: element.tagName.toLowerCase(),
    id: element.id || '',
    className: element.className || '',
    textContent: element.textContent.trim().substring(0, 100),
    xpath: xpath,
    cssSelector: cssSelector,
    attributes: attributes,
    innerHTML: element.innerHTML.substring(0, 200),
    outerHTML: element.outerHTML.substring(0, 200),
    selectedElement: element.outerHTML, // Store the complete HTML of the element
    timestamp: new Date().toISOString()
  };
}

// Get element's XPath
function getElementXPath(element) {
  if (element && element.nodeType === Node.ELEMENT_NODE) {
    const paths = [];
    let current = element;
    
    while (current && current.nodeType === Node.ELEMENT_NODE) {
      let index = 0;
      let sibling = current.previousSibling;
      
      while (sibling) {
        if (sibling.nodeType === Node.ELEMENT_NODE && sibling.tagName === current.tagName) {
          index++;
        }
        sibling = sibling.previousSibling;
      }
      
      const tagName = current.tagName.toLowerCase();
      const pathIndex = (index === 0) ? '' : `[${index + 1}]`;
      paths.unshift(`${tagName}${pathIndex}`);
      
      current = current.parentNode;
    }
    
    return '/' + paths.join('/');
  }
  
  return '';
}

// Get element's CSS selector
function getElementCSSSelector(element) {
  if (!element) return '';
  
  // If element has an ID, use it
  if (element.id) {
    return '#' + element.id;
  }
  
  // If element has a class, use the first class
  if (element.className) {
    const classes = element.className.split(' ').filter(c => c);
    if (classes.length > 0) {
      return element.tagName.toLowerCase() + '.' + classes[0];
    }
  }
  
  // Otherwise, use the element's tag name and position
  const siblings = Array.from(element.parentNode.children).filter(
    child => child.tagName === element.tagName
  );
  
  if (siblings.length === 1) {
    return element.tagName.toLowerCase();
  }
  
  const index = siblings.indexOf(element) + 1;
  return `${element.tagName.toLowerCase()}:nth-child(${index})`;
}

// Flash the element to indicate selection
function flashElement(element) {
  const originalOutline = element.style.outline;
  const originalBackgroundColor = element.style.backgroundColor;
  
  element.style.outline = '2px solid #34a853';
  element.style.backgroundColor = 'rgba(52, 168, 83, 0.2)';
  
  setTimeout(() => {
    element.style.outline = originalOutline;
    element.style.backgroundColor = originalBackgroundColor;
  }, 500);
}

// On load: restore selections and (optionally) selection mode
(function initializeFromStorage() {
  loadSelectionsFromBackground(() => {
    try {
      chrome.storage.local.get('isSelectionMode', (data) => {
        if (data && data.isSelectionMode) {
          startSelectionMode();
          if (window.updateElementCounter) {
            window.updateElementCounter(Array.isArray(selectedElements) ? selectedElements.length : 0);
          }
        }
      });
    } catch (_) {}
  });
})();
