import { useCallback, useRef } from 'react';
import { isEpisodeWatched } from '../../library/watch-progress';
import type { AnimecixAPI } from '../../types/animecix-api';

/** Online embeds never report library watch history. */
export function useLibraryWatchProgress(episodeId: string | null) {
  const reported = useRef<string | null>(null);

  return useCallback(async (currentTime: number, duration: number) => {
    if (!episodeId || reported.current === episodeId || !isEpisodeWatched(currentTime, duration)) return;
    const api = (window as unknown as { animecix?: AnimecixAPI }).animecix;
    if (!api?.reportLibraryProgress) return;
    reported.current = episodeId;
    try {
      await api.reportLibraryProgress(episodeId, currentTime, duration);
    } catch {
      // Retry on the next time update if saving failed.
      if (reported.current === episodeId) reported.current = null;
    }
  }, [episodeId]);
}
