import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { BrowserWindow, IpcMainInvokeEvent } from 'electron';
import type { StorageService } from '../../src/storage/StorageService';
import type { LibraryManager } from '../../src/library/LibraryManager';
import { registerLibraryIpc } from '../../src/library/library.ipc';

const handlers = vi.hoisted(() => new Map<string, (...args: any[]) => any>());
vi.mock('electron', () => ({
  ipcMain: { handle: (name: string, handler: (...args: any[]) => any) => handlers.set(name, handler) },
}));
vi.mock('electron-log', () => ({ default: { info: vi.fn() } }));
vi.mock('../../src/download/prune-missing', () => ({ pruneMissingDownloads: vi.fn() }));
vi.mock('../../src/player/tau-localhost', () => ({ getPlayerBaseUrl: () => 'http://tau-player.localhost:7347' }));

describe('library progress IPC', () => {
  const frame = { url: '' };
  const webContents = { mainFrame: frame };
  const storage = {
    markLibraryEpisodeWatched: vi.fn(),
    getDownloadById: () => null,
    getCacheEntry: () => null,
    getAnimeTitleForEpisode: () => null,
  };
  const manager = { deactivate: vi.fn(), show: vi.fn(), hide: vi.fn() };
  const win = {
    webContents,
    isDestroyed: () => false,
    loadURL: async (url: string) => { frame.url = url; },
  };
  const event = { sender: webContents, senderFrame: frame } as unknown as IpcMainInvokeEvent;
  const report = (id = 'episode-1', time = 900, duration = 1000, sender = event) =>
    handlers.get('library:progress')!(sender, id, time, duration);

  beforeEach(async () => {
    handlers.clear();
    vi.clearAllMocks();
    registerLibraryIpc(win as unknown as BrowserWindow, storage as unknown as StorageService,
      manager as unknown as LibraryManager, '');
    await handlers.get('library:playEpisode')!(event, 'episode-1');
  });

  it('only marks the playing library episode at the threshold', () => {
    report('episode-1', 899);
    report('other-episode');
    expect(storage.markLibraryEpisodeWatched).not.toHaveBeenCalled();
    report();
    expect(storage.markLibraryEpisodeWatched).toHaveBeenCalledExactlyOnceWith('episode-1');
  });

  it('ignores online pages and embedded frames', () => {
    report('episode-1', 900, 1000, { ...event, senderFrame: { url: frame.url } } as IpcMainInvokeEvent);
    frame.url = 'https://animecix.tv';
    report();
    expect(storage.markLibraryEpisodeWatched).not.toHaveBeenCalled();
  });

  it('ignores stale reports after returning to the library', async () => {
    await handlers.get('library:show')!(event);
    report();
    expect(storage.markLibraryEpisodeWatched).not.toHaveBeenCalled();
  });

  it('tracks the next episode independently', async () => {
    report();
    await handlers.get('library:playEpisode')!(event, 'episode-2');
    report();
    expect(storage.markLibraryEpisodeWatched).toHaveBeenCalledTimes(1);
    report('episode-2');
    expect(storage.markLibraryEpisodeWatched).toHaveBeenLastCalledWith('episode-2');
  });
});
