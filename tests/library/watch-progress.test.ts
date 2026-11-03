import { describe, expect, it } from 'vitest';
import { isEpisodeWatched } from '../../src/library/watch-progress';

describe('library watched threshold', () => {
  it('marks at 90%, but not before', () => {
    expect(isEpisodeWatched(899, 1000)).toBe(false);
    expect(isEpisodeWatched(900, 1000)).toBe(true);
    expect(isEpisodeWatched(1000, 1000)).toBe(true);
  });

  it.each([0, -1, NaN, Infinity])('ignores unknown or invalid duration %s', (duration) => {
    expect(isEpisodeWatched(1000, duration)).toBe(false);
  });

  it.each([-1, NaN, Infinity])('ignores invalid playback time %s', (time) => {
    expect(isEpisodeWatched(time, 1000)).toBe(false);
  });
});
