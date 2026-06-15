export default defineBackground(() => {
  // ClipMind background service worker.
  // Updates the toolbar badge so the icon signals when the active tab is a YouTube video.

  chrome.runtime.onInstalled.addListener(() => {
    console.log('ClipMind installed');
  });

  function isYouTubeWatch(url?: string): boolean {
    if (!url) return false;
    return url.includes('youtube.com/watch') || url.includes('youtu.be/');
  }

  function updateBadge(tabId: number, url?: string) {
    const active = isYouTubeWatch(url);
    chrome.action.setBadgeText({ text: active ? '▶' : '', tabId });
    if (active) {
      chrome.action.setBadgeBackgroundColor({ color: '#FF0033', tabId });
    }
  }

  chrome.tabs.onActivated.addListener(async ({ tabId }) => {
    try {
      const tab = await chrome.tabs.get(tabId);
      updateBadge(tabId, tab.url);
    } catch {
      // Tab may not be accessible
    }
  });

  chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
    if (changeInfo.status === 'complete') {
      updateBadge(tabId, tab.url);
    }
  });
});
