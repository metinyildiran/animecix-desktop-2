import { describe, it, expect, vi } from 'vitest';
vi.mock('electron', () => ({}));
vi.mock('electron-log', () => ({ default: { info: vi.fn() } }));
import { LibraryManager } from '../../src/library/LibraryManager';
import type { BrowserWindow } from 'electron';

describe('local screen navigation', () => {
  it('opens downloads as a full page and allows switching to the library', () => {
    let url = 'https://animecix.tv/';
    const loadURL = vi.fn((next: string) => { url = next; return Promise.resolve(); });
    const win = { loadURL, webContents: { on: vi.fn(), getURL: () => url } };
    const manager = new LibraryManager(win as unknown as BrowserWindow);
    manager.show('downloads');
    expect(loadURL).toHaveBeenLastCalledWith('animecix-library://bundle/downloads');
    expect(manager.isVisible()).toBe(true);
    manager.show('downloads');
    expect(loadURL).toHaveBeenCalledTimes(1);
    manager.show();
    expect(loadURL).toHaveBeenLastCalledWith('animecix-library://bundle/');
    manager.show('downloads');
    expect(loadURL).toHaveBeenCalledTimes(3);
    manager.hide();
    expect(manager.isVisible()).toBe(false);
  });
});
