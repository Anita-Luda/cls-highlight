// popup.js

document.addEventListener('DOMContentLoaded', () => {
  const toggleButton = document.getElementById('toggleHighlight');

  function updateButtonState(isEnabled) {
    if (isEnabled) {
      toggleButton.textContent = 'Wyłącz Podświetlenie';
      toggleButton.classList.remove('off');
    } else {
      toggleButton.textContent = 'Włącz Podświetlenie';
      toggleButton.classList.add('off');
    }
  }

  chrome.storage.sync.get('highlightEnabled', (data) => {
    const isEnabled = data.highlightEnabled !== false;
    updateButtonState(isEnabled);
  });

  toggleButton.addEventListener('click', () => {
    chrome.storage.sync.get('highlightEnabled', (data) => {
      let isEnabled = data.highlightEnabled !== false;
      isEnabled = !isEnabled;

      chrome.storage.sync.set({ 'highlightEnabled': isEnabled }, () => {
        updateButtonState(isEnabled);
        chrome.runtime.sendMessage({ action: 'toggleHighlightGlobal', isEnabled: isEnabled });
      });
    });
  });
});
