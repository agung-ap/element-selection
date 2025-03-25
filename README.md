# Web Element Selector

A Chrome extension that allows you to select HTML elements from any webpage and export their data to CSV format. This tool is ideal for web scraping, data collection, UX audits, and content analysis tasks without writing any code.

## Features

- **Interactive Element Selection**: Easily select any element on a webpage with a visual highlight guide
- **Shift+Click Selection**: Hold Shift to highlight elements and click to select them
- **Floating Control Bar**: Provides always-accessible controls with selection status and count
- **Text Selection Prevention**: Automatically prevents text from being selected while choosing elements
- **Live Element Counter**: Tracks how many elements you've selected in real-time
- **Data Preview**: Shows a preview of your most recently selected elements in the popup
- **CSV Export**: Export all collected element data to CSV format with a single click
- **Comprehensive Data Capture**: Collects tag name, ID, class, text content, CSS selectors, XPath, and full HTML

## Installation

1. **Clone or download** this repository to your local machine
2. **Open Chrome** and navigate to `chrome://extensions/`
3. **Enable Developer Mode** by toggling the switch in the top right corner
4. **Click "Load unpacked"** and select the directory containing the extension files
5. The extension should now appear in your Chrome toolbar

## How to Use

### Starting Element Selection

1. Click the Web Element Selector icon in your Chrome toolbar
2. Click the "Start Selection Mode" button in the popup
3. A floating navigation bar will appear at the top of the webpage showing that selection mode is active

### Selecting Elements

1. When selection mode is active, your cursor will change to a crosshair
2. **Hold the Shift key** to see element highlighting (with a green outline and background)
3. **Click while still holding Shift** to select an element
4. Selected elements will briefly flash green to confirm selection
5. The counter in both the navbar and popup will update with each selection

### Managing Selection Mode

- **Toggle Selection**: Click "Stop Selection" in the navbar to pause selection mode, then "Start Selection" to resume
- **Close Selection Mode**: Click the "×" button to completely exit selection mode and remove the navbar
- You can also toggle selection mode from the extension popup with the "Start Selection Mode" and "Stop Selection" buttons

### Exporting Data

1. Click the extension icon to open the popup
2. View selected elements in the preview panel
3. Click "Export to CSV" to download the data
4. The CSV file will include detailed information about each selected element including full HTML

### Clearing Data

- Click "Clear Data" in the popup to remove all currently selected elements and start fresh

## Technical Details

The extension consists of the following components:

- **manifest.json**: Extension configuration and permissions
- **popup.html/css/js**: User interface for the extension popup
- **content.js**: Script that runs on webpages to handle element selection
- **background.js**: Handles background tasks and data persistence between tabs

Selected element data includes:
- Tag name
- Element ID
- Class names
- Text content
- XPath location
- CSS selector
- Complete HTML content (in a dedicated "selectedElement" column)
- Selection timestamp

## State Synchronization

The extension maintains synchronized state between:
- The floating navbar on the webpage
- The extension popup interface
- Chrome's local storage

This ensures a consistent experience regardless of how you interact with the extension.

## Privacy and Data Security

This extension operates entirely on your local machine. No data is sent to any remote servers, and all collected information remains in your browser until explicitly exported as a CSV file. The extension requires only the necessary permissions to function.

## Troubleshooting

If the extension doesn't appear to be working:

1. Make sure it's properly installed and enabled in Chrome extensions
2. Try refreshing the webpage before activating selection mode
3. Check if another extension might be interfering with element selection
4. If the navbar disappears unexpectedly, click the extension icon and start selection mode again

---

Created for efficient web element collection and analysis. If you encounter any issues or have suggestions for improvements, please create an issue in the GitHub repository.
