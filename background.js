// background.js

let highlightEnabledGlobal = true;

chrome.storage.sync.get('highlightEnabled', (data) => {
    highlightEnabledGlobal = data.highlightEnabled !== false;
    console.log(`[Background] Początkowy stan podświetlenia: ${highlightEnabledGlobal}`);
});

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'toggleHighlightGlobal') {
        highlightEnabledGlobal = request.isEnabled;
        console.log(`[Background] Zmieniono globalny stan podświetlenia na: ${highlightEnabledGlobal}`);

        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                const tabId = tabs[0].id;
                if (highlightEnabledGlobal) {
                    chrome.scripting.executeScript({
                        target: { tabId: tabId },
                        files: ['content.js']
                    }, () => {
                        if (chrome.runtime.lastError) {
                            console.error("[Background] Błąd wstrzykiwania content.js:", chrome.runtime.lastError.message);
                        } else {
                            console.log(`[Background] content.js wstrzyknięty do karty ${tabId}.`);
                            chrome.tabs.sendMessage(tabId, { action: 'initHighlighting', isEnabled: true });
                        }
                    });
                } else {
                    chrome.tabs.sendMessage(tabId, { action: 'initHighlighting', isEnabled: false }, (response) => {
                        if (chrome.runtime.lastError) {
                            console.warn("[Background] Nie udało się wysłać wiadomości do content.js (może nie załadowany):", chrome.runtime.lastError.message);
                        } else {
                            console.log(`[Background] Wysłano sygnał wyłączenia do karty ${tabId}.`);
                        }
                    });
                }
            }
        });
    }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete' && highlightEnabledGlobal && tab.url && !tab.url.startsWith('chrome://')) {
        chrome.scripting.executeScript({
            target: { tabId: tabId },
            files: ['content.js']
        }, () => {
            if (chrome.runtime.lastError) {
                console.warn("[Background] Błąd wstrzykiwania content.js na nowej/przeładowanej karcie:", chrome.runtime.lastError.message);
            } else {
                console.log(`[Background] content.js wstrzyknięty do nowej/przeładowanej karty ${tabId}.`);
                chrome.tabs.sendMessage(tabId, { action: 'initHighlighting', isEnabled: true });
            }
        });
    }
});
