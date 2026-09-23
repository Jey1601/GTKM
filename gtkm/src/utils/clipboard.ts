/**
 * Cross-browser clipboard copy helper with fallbacks for Mobile Safari, Chrome, Firefox, and Brave
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // 1. Try modern navigator.clipboard API
  if (typeof navigator !== 'undefined' && navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      // Fall through to fallback
    }
  }

  // 2. Fallback for iOS Safari / Brave / older mobile webviews
  try {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    textArea.style.position = 'fixed';
    textArea.style.left = '-9999px';
    textArea.style.top = '0';
    textArea.style.opacity = '0';
    textArea.setAttribute('readonly', '');
    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();
    
    // For iOS Safari selection range
    textArea.setSelectionRange(0, 99999);

    const successful = document.execCommand('copy');
    document.body.removeChild(textArea);
    return successful;
  } catch (err) {
    console.warn('Fallback clipboard copy failed:', err);
    return false;
  }
}
