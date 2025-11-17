import translateTexts from '../services/translationService';

const ORIGINAL_TEXT_ATTR = 'data-original-text';
const ORIGINAL_PLACEHOLDER_ATTR = 'data-original-placeholder';
const ORIGINAL_ARIA_LABEL_ATTR = 'data-original-aria-label';
const ORIGINAL_TITLE_ATTR = 'data-original-title';
const ORIGINAL_ALT_ATTR = 'data-original-alt';

// This internal variable tracks the *actual* language applied to the DOM.
// It helps prevent unnecessary translation calls if the DOM is already in the target language.
let currentDOMLanguage: 'en' | 'ar' = 'en';

/**
 * Collects translatable text from the DOM, stores original values, and performs translation if needed.
 * @param root The root HTML element to start traversal from (e.g., `document.getElementById('root')`).
 * @param targetLanguage The language to translate to ('ar') or 'en' for collecting originals.
 */
async function collectAndTranslate(root: HTMLElement, targetLanguage: 'ar') {
  const textsToProcess: { element: HTMLElement | Attr; text: string }[] = [];
  let idCounter = 0;

  // Function to process an element's text content
  const processTextContent = (element: HTMLElement) => {
    // Check if the element has direct text content and no children that might hold other text
    const hasDirectText = Array.from(element.childNodes).some(
      node => node.nodeType === Node.TEXT_NODE && node.textContent && node.textContent.trim() !== ''
    );
    if (hasDirectText && !element.closest('script, style, noscript')) { // Avoid translating script/style content
      const original = element.getAttribute(ORIGINAL_TEXT_ATTR);
      if (!original) {
        // Store current (English) text as original if not already stored
        element.setAttribute(ORIGINAL_TEXT_ATTR, element.textContent?.trim() || '');
        textsToProcess.push({ element: element, text: element.textContent?.trim() || '' });
      } else {
        // If already stored, use the stored original for translation
        textsToProcess.push({ element: element, text: original });
      }
    }
  };

  // Function to process attributes
  const processAttributeContent = (element: HTMLElement, attrName: string, originalDataAttr: string) => {
    if (element.closest('script, style, noscript')) return;

    const currentAttrValue = element.getAttribute(attrName);
    const originalAttrValue = element.getAttribute(originalDataAttr);

    if (currentAttrValue && currentAttrValue.trim() !== '') {
      const attrNode = element.attributes.getNamedItem(attrName);
      if (attrNode) {
        if (!originalAttrValue) {
          element.setAttribute(originalDataAttr, currentAttrValue.trim());
          textsToProcess.push({ element: attrNode, text: currentAttrValue.trim() });
        } else {
          textsToProcess.push({ element: attrNode, text: originalAttrValue });
        }
      }
    }
  };

  // Select a broader range of elements that might contain text
  root.querySelectorAll(
    'p, h1, h2, h3, h4, h5, h6, span:not([data-original-text]), a:not([data-original-text]), button:not([data-original-text]), label:not([data-original-text]), th:not([data-original-text]), td:not([data-original-text]), option:not([data-original-text]), div:not([data-original-text])'
  ).forEach(el => processTextContent(el as HTMLElement));

  // Select elements with translatable attributes
  root.querySelectorAll('input[placeholder], textarea[placeholder]').forEach(el => processAttributeContent(el as HTMLElement, 'placeholder', ORIGINAL_PLACEHOLDER_ATTR));
  root.querySelectorAll('[aria-label]').forEach(el => processAttributeContent(el as HTMLElement, 'aria-label', ORIGINAL_ARIA_LABEL_ATTR));
  root.querySelectorAll('[title]').forEach(el => processAttributeContent(el as HTMLElement, 'title', ORIGINAL_TITLE_ATTR));
  root.querySelectorAll('img[alt]').forEach(el => processAttributeContent(el as HTMLElement, 'alt', ORIGINAL_ALT_ATTR));


  // Create a unique list of texts to send to the API to avoid redundant translations
  const uniqueTextsMap = new Map<string, string>(); // originalText -> uniqueId
  const apiRequestPayload: { id: string; text: string }[] = [];

  textsToProcess.forEach(item => {
    if (!uniqueTextsMap.has(item.text)) {
      const id = `text-${idCounter++}`;
      uniqueTextsMap.set(item.text, id);
      apiRequestPayload.push({ id, text: item.text });
    }
  });

  if (apiRequestPayload.length === 0) {
    return;
  }

  // Perform batch translation
  const translatedResults = await translateTexts(apiRequestPayload, targetLanguage);
  const translatedMap = new Map<string, string>(); // uniqueId -> translatedText
  translatedResults.forEach(item => translatedMap.set(item.id, item.translatedText));

  // Apply translations back to the DOM
  textsToProcess.forEach(item => {
    const uniqueId = uniqueTextsMap.get(item.text);
    const translatedText = uniqueId ? translatedMap.get(uniqueId) : undefined;

    if (translatedText) {
      if (item.element instanceof HTMLElement) {
        item.element.textContent = translatedText;
      } else if (item.element instanceof Attr) {
        const parentElement = item.element.ownerElement;
        if (parentElement) {
          parentElement.setAttribute(item.element.name, translatedText);
        }
      }
    }
  });
}

/**
 * Restores all original English texts from `data-original-*` attributes and cleans them up.
 * @param root The root HTML element to start traversal from.
 */
function restoreOriginal(root: HTMLElement) {
  // Restore text content
  root.querySelectorAll(`[${ORIGINAL_TEXT_ATTR}]`).forEach(element => {
    element.textContent = element.getAttribute(ORIGINAL_TEXT_ATTR);
    element.removeAttribute(ORIGINAL_TEXT_ATTR);
  });

  // Restore attributes
  root.querySelectorAll(`[${ORIGINAL_PLACEHOLDER_ATTR}]`).forEach(element => {
    element.setAttribute('placeholder', element.getAttribute(ORIGINAL_PLACEHOLDER_ATTR)!);
    element.removeAttribute(ORIGINAL_PLACEHOLDER_ATTR);
  });
  root.querySelectorAll(`[${ORIGINAL_ARIA_LABEL_ATTR}]`).forEach(element => {
    element.setAttribute('aria-label', element.getAttribute(ORIGINAL_ARIA_LABEL_ATTR)!);
    element.removeAttribute(ORIGINAL_ARIA_LABEL_ATTR);
  });
  root.querySelectorAll(`[${ORIGINAL_TITLE_ATTR}]`).forEach(element => {
    element.setAttribute('title', element.getAttribute(ORIGINAL_TITLE_ATTR)!);
    element.removeAttribute(ORIGINAL_TITLE_ATTR);
  });
  root.querySelectorAll(`[${ORIGINAL_ALT_ATTR}]`).forEach(element => {
    element.setAttribute('alt', element.getAttribute(ORIGINAL_ALT_ATTR)!);
    element.removeAttribute(ORIGINAL_ALT_ATTR);
  });
}

/**
 * Main function to apply page translation or restore original English.
 * It detects the current state and applies changes accordingly.
 * @param targetLanguage The desired language for the page ('en' or 'ar').
 * @param setIsTranslating A callback to update the loading state in the UI.
 */
export async function applyPageTranslation(targetLanguage: 'en' | 'ar', setIsTranslating: (is: boolean) => void) {
  // If the DOM is already in the target language, do nothing
  if (currentDOMLanguage === targetLanguage) {
    // console.log(`DOM is already in ${targetLanguage}. No translation needed.`);
    return;
  }

  setIsTranslating(true);
  const root = document.getElementById('root');
  if (!root) {
    console.error('Root element not found for translation.');
    setIsTranslating(false);
    return;
  }

  try {
    if (targetLanguage === 'en') {
      restoreOriginal(root);
      document.documentElement.dir = 'ltr';
    } else { // targetLanguage === 'ar'
      await collectAndTranslate(root, targetLanguage);
      document.documentElement.dir = 'rtl';
    }
    currentDOMLanguage = targetLanguage; // Update internal state after successful application
  } catch (error) {
    console.error('Page translation failed:', error);
    // Optionally display a user-friendly error message on the page
  } finally {
    setIsTranslating(false);
  }
}