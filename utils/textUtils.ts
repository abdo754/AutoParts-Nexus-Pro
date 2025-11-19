/**
 * Checks if a given string contains Arabic characters.
 * @param text The string to check.
 * @returns True if the string contains at least one Arabic character, false otherwise.
 */
export const containsArabic = (text: string): boolean => {
  if (!text || typeof text !== 'string') {
    return false;
  }
  // Regular expression to match Arabic characters (including extended Arabic, Arabic-Indic digits, etc.)
  // Range: \u0600-\u06FF (Basic Arabic)
  // Range: \u0750-\u077F (Arabic Supplement)
  // Range: \u08A0-\u08FF (Arabic Extended-A)
  // Range: \uFB50-\uFDFF (Arabic Presentation Forms-A)
  // Range: \uFE70-\uFEFF (Arabic Presentation Forms-B)
  const arabicRegex = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return arabicRegex.test(text);
};
