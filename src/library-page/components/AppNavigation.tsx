import React, { useState } from 'react';
import '../navigation.css';

export function AppNavigation({ downloads }: { downloads: boolean }) {
  const [error, setError] = useState(false);
  const navigate = async (page: 'site' | 'downloads' | 'library') => {
    try {
      setError(false);
      if (!window.animecix) throw new Error('Desktop bridge unavailable');
      if (page === 'site') await window.animecix.hideLibrary();
      else if (page === 'downloads') await window.animecix.showDownloads();
      else await window.animecix.showLibrary();
    } catch { setError(true); }
  };
  return <header className={`app-navigation ${navigator.platform.startsWith('Mac') ? 'mac' : ''}`}>
    <nav aria-label="Uygulama gezinmesi">
      <button title="Geri" aria-label="Geri" onClick={() => history.back()}>←</button>
      <button title="İleri" aria-label="İleri" onClick={() => history.forward()}>→</button>
      <button onClick={() => location.reload()}>Yenile</button>
      <button onClick={() => void navigate('site')}>Ana sayfa</button>
      <button aria-current={downloads ? 'page' : undefined} onClick={() => void navigate('downloads')}>İndirilenler</button>
      <button aria-current={!downloads ? 'page' : undefined} onClick={() => void navigate('library')}>Kütüphane</button>
    </nav>
    {error && <span role="alert">Sayfa açılamadı. Tekrar deneyin.</span>}
  </header>;
}
