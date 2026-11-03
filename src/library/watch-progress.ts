export function isEpisodeWatched(currentTime: number, duration: number): boolean {
  return Number.isFinite(currentTime) && Number.isFinite(duration)
    && duration > 0 && currentTime >= duration * 0.9;
}
