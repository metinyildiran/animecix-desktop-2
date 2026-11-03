import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import Database from 'better-sqlite3';
import { StorageService } from '../../src/storage/StorageService';

const state = vi.hoisted(() => ({ directory: '' }));
vi.mock('electron', () => ({ app: { getPath: () => state.directory } }));

const episode = {
  episodeId: 'anime_1_1', animeTitle: 'Test Anime', seasonNumber: '1',
  episodeNumber: '1', translator: '', posterUrl: '', posterPath: '',
  source: 'download' as const,
};

describe('library watched persistence', () => {
  let storage: StorageService;

  beforeEach(() => {
    state.directory = fs.mkdtempSync(path.join(os.tmpdir(), 'library-watched-'));
    storage = new StorageService();
    storage.upsertEpisodeMetadata(episode);
  });

  afterEach(() => {
    storage.close();
    expect(path.dirname(state.directory)).toBe(path.resolve(os.tmpdir()));
    expect(path.basename(state.directory)).toMatch(/^library-watched-/);
    fs.rmSync(state.directory, { recursive: true, force: true });
  });

  it('starts unwatched and only marks the selected episode', () => {
    storage.upsertEpisodeMetadata({ ...episode, episodeId: 'anime_1_2', episodeNumber: '2', source: 'cache' });
    expect(storage.getLibraryEpisodes(episode.animeTitle).map(e => e.watched)).toEqual([false, false]);
    storage.markLibraryEpisodeWatched('anime_1_2');
    expect(storage.getLibraryEpisodes(episode.animeTitle).map(e => e.watched)).toEqual([false, true]);
  });

  it('survives repeated reports, metadata replacement, and restarting storage', () => {
    storage.markLibraryEpisodeWatched(episode.episodeId);
    storage.markLibraryEpisodeWatched(episode.episodeId);
    storage.upsertEpisodeMetadata({ ...episode, translator: 'Updated' });
    storage.close();
    storage = new StorageService();
    expect(storage.getLibraryEpisodes(episode.animeTitle)[0]).toMatchObject({ watched: true, translator: 'Updated' });
  });

  it('does not create watched history for an unknown episode', () => {
    storage.markLibraryEpisodeWatched('unknown');
    storage.upsertEpisodeMetadata({ ...episode, episodeId: 'unknown' });
    expect(storage.getLibraryEpisodes(episode.animeTitle).every(e => !e.watched)).toBe(true);
  });

  it('upgrades an existing database without losing library entries', () => {
    storage.close();
    const db = new Database(path.join(state.directory, 'animecix.db'));
    db.exec('DROP TABLE library_watched');
    db.close();
    storage = new StorageService();
    expect(storage.getLibraryEpisodes(episode.animeTitle)[0].watched).toBe(false);
    storage.markLibraryEpisodeWatched(episode.episodeId);
    expect(storage.getLibraryEpisodes(episode.animeTitle)[0].watched).toBe(true);
  });
});
