import { describe, expect, it } from 'vitest';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { EpisodeRow } from '../../src/library-page/components/EpisodeRow';
import type { LibraryEpisode } from '../../src/library-page/types';

const episode: LibraryEpisode = {
  episodeId: 'ep1', animeTitle: 'Anime', seasonNumber: '1', episodeNumber: '1',
  translator: '', source: 'download', sizeBytes: 1024, createdAt: 0,
  offlineUrl: '', watched: false,
};

describe('library watched indicator', () => {
  it('shows an accessible checkmark only for watched episodes', () => {
    const render = (watched: boolean) => renderToStaticMarkup(React.createElement(EpisodeRow, {
      episode: { ...episode, watched }, onDelete: () => {},
    }));
    expect(render(false)).not.toContain('aria-label="İzlendi"');
    expect(render(true)).toContain('aria-label="İzlendi"');
    expect(render(true)).toContain('S1E1');
  });
});
