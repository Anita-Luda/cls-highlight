// content.js

console.log("Wtyczka 'Trwałe Podświetlenie Przesunięć Układu' załadowana (dynamicznie).");

let highlightObserversInitialized = false; // Nowa flaga do kontroli inicjalizacji
let performanceObserver = null;
let mutationObserver = null; // MutationObserver nadal jest, ale jego logika podświetlania jest wyłączona

// Funkcja do stosowania stylów podświetlenia (tylko dla CLS)
function applyHighlight(element) {
  // Sprawdzamy, czy obserwatorzy są aktywnie włączeni i czy element to prawdziwy element DOM
  if (!highlightObserversInitialized || !element || element.nodeType !== Node.ELEMENT_NODE || (element.offsetWidth === 0 && element.offsetHeight === 0 && element.getClientRects().length === 0)) {
      return;
  }

  if (!element.classList.contains('layout-shift-highlight')) {
    element.classList.add('layout-shift-highlight');
    element.style.setProperty('border', '2px solid white', 'important'); // Pierwotny styl
    element.style.setProperty('outline', '5px solid red', 'important'); // Pierwotny styl
    element.style.setProperty('box-shadow', '0 0 5px rgba(255, 0, 0, 0.5)', 'important');
  }
}

// Funkcja do usuwania wszystkich podświetleń ze strony
function removeAllHighlights() {
  const highlightedElements = document.querySelectorAll('.layout-shift-highlight');
  highlightedElements.forEach(element => {
    element.classList.remove('layout-shift-highlight');
    element.style.removeProperty('border'); // Usuwamy pierwotny styl
    element.style.removeProperty('outline'); // Usuwamy pierwotny styl
    element.style.removeProperty('box-shadow');
  });
  console.log("Usunięto wszystkie podświetlenia.");
}

// Funkcja do inicjalizacji (uruchamiania) obserwatorów
function initializeObservers() {
  if (performanceObserver) {
    performanceObserver.disconnect();
  }
  if (mutationObserver) {
    mutationObserver.disconnect();
  }

  performanceObserver = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      if (entry.entryType === 'layout-shift') {
        if (!entry.hadRecentInput && entry.sources.length > 0) {
          entry.sources.forEach(source => {
            const shiftedElement = source.node;
            if (shiftedElement && shiftedElement.nodeType === Node.ELEMENT_NODE) {
              applyHighlight(shiftedElement); // Wywołanie applyHighlight bez typu
            }
          });
        }
      }
    }
  });

  try {
    performanceObserver.observe({ type: 'layout-shift', buffered: true });
    console.log("PerformanceObserver uruchomiony.");
  } catch (e) {
    console.error("Błąd podczas uruchamiania PerformanceObserver:", e);
  }

  // MutationObserver jest obecny, ale nie aktywowany do podświetlania w tej wersji
  mutationObserver = new MutationObserver((mutationsList) => {
    // Tutaj nie ma logiki applyHighlight, więc nic nie będzie podświetlane na niebiesko.
    // Observer jest jedynie obserwatorem zmian w DOM.
  });

  try {
    mutationObserver.observe(document.body, { childList: true, subtree: true });
    console.log("MutationObserver uruchomiony (pasywnie).");
  } catch (e) {
    console.error("Błąd podczas uruchamiania MutationObserver:", e);
  }

  highlightObserversInitialized = true; // Obserwatorzy są teraz aktywnie uruchomieni
}

// Funkcja do zatrzymywania obserwatorów
function disconnectObservers() {
  if (performanceObserver) {
    performanceObserver.disconnect();
    performanceObserver = null;
    console.log("PerformanceObserver zatrzymany.");
  }
  if (mutationObserver) {
    mutationObserver.disconnect();
    mutationObserver = null;
    console.log("MutationObserver zatrzymany.");
  }
  removeAllHighlights();
  highlightObserversInitialized = false; // Obserwatorzy nieaktywni
}

// Obsługa wiadomości z background.js
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  if (request.action === 'initHighlighting') {
    if (request.isEnabled) {
      if (!highlightObserversInitialized) {
        initializeObservers();
      }
    } else {
      disconnectObservers();
    }
    // sendResponse({ status: "received" }); // Opcjonalnie, do potwierdzenia odbioru
  }
});

// Dodajemy style CSS do DOM (tylko dla CLS)
const style = document.createElement('style');
style.textContent = `
  .layout-shift-highlight {
    border: 2px solid white !important; /* Pierwotny styl */
    outline: 5px solid red !important; /* Pierwotny styl */
    box-shadow: 0 0 5px rgba(255, 0, 0, 0.5) !important;
    transition: all 0.1s ease-in-out; /* Dodaje płynność */
  }
`;
document.head.appendChild(style);

// Nie ma początkowego sprawdzenia stanu - content.js czeka na sygnał od background.js
