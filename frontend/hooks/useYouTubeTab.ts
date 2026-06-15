import { useState, useEffect } from 'react';
import { isYouTubeUrl } from '../lib/api';

interface YouTubeTabState {
  isYouTube: boolean;
  videoUrl: string | null;
  isLoading: boolean;
}

export function useYouTubeTab(): YouTubeTabState {
  const [state, setState] = useState<YouTubeTabState>({
    isYouTube: false,
    videoUrl: null,
    isLoading: true,
  });

  useEffect(() => {
    async function detectTab() {
      try {
        const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
        const url = tab?.url ?? '';
        const isYouTube = isYouTubeUrl(url);
        setState({
          isYouTube,
          videoUrl: isYouTube ? url : null,
          isLoading: false,
        });
      } catch {
        setState({ isYouTube: false, videoUrl: null, isLoading: false });
      }
    }
    detectTab();
  }, []);

  return state;
}
