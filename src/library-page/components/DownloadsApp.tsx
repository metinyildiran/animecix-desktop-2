import React, { useCallback, useEffect, useState } from 'react';
import type { DownloadProgress } from '../../types/animecix-api';
import { DeleteConfirmation, TrashIcon } from './DeleteConfirmation';
import '../downloads.css';

const labels = { downloading: 'İndiriliyor', queued: 'Sırada', paused: 'Duraklatıldı', completed: 'Tamamlandı', failed: 'Başarısız' };
const filters = [['all', 'Tümü'], ['active', 'Devam eden'], ['completed', 'Tamamlanan'], ['failed', 'Başarısız']] as const;
function bytes(value: number) {
  if (!value || value < 0) return '0 B';
  const unit = Math.min(3, Math.floor(Math.log(value) / Math.log(1024)));
  return `${(value / 1024 ** unit).toLocaleString('tr-TR', { maximumFractionDigits: 1 })} ${['B', 'KB', 'MB', 'GB'][unit]}`;
}
function getApi() {
  if (!window.animecix) throw new Error('Desktop bridge unavailable');
  return window.animecix;
}
function DownloadIcon() {
  return <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M12 3v12m-5-5 5 5 5-5M4 16v5h16v-5" /></svg>;
}

export function DownloadsApp() {
  const [items, setItems] = useState<DownloadProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const [pending, setPending] = useState<DownloadProgress | null>(null);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    try {
      if (!window.animecix) throw new Error('Bridge unavailable');
      const result = await window.animecix.getDownloadQueue();
      setItems(previous => result.map(item => ({ ...item, speedBps: item.status === 'downloading' ? previous.find(p => p.id === item.id)?.speedBps ?? 0 : 0 })));
      setError('');
    } catch { setError('İndirmeler yüklenemedi. Lütfen tekrar deneyin.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    document.title = 'İndirmeler — AnimeciX';
    void refresh();
    const timer = window.setInterval(() => void refresh(), 2000);
    const progress = window.animecix?.onDownloadProgress(item => setItems(prev => prev.some(p => p.id === item.id) ? prev.map(p => p.id === item.id ? item : p) : [item, ...prev]));
    const complete = window.animecix?.onDownloadComplete(() => void refresh());
    return () => { clearInterval(timer); progress?.(); complete?.(); };
  }, [refresh]);
  const act = async (action: () => Promise<unknown>) => {
    setBusy(true);
    try { await action(); await refresh(); }
    catch { setError('İşlem tamamlanamadı. Lütfen tekrar deneyin.'); }
    finally { setBusy(false); }
  };
  const active = items.filter(i => i.status !== 'completed' && i.status !== 'failed');
  const completed = items.filter(i => i.status === 'completed');
  const visible = items.filter(i => (filter === 'all' || (filter === 'active' ? active.includes(i) : i.status === filter)) && i.title.toLocaleLowerCase('tr').includes(search.toLocaleLowerCase('tr')));
  return <div className="downloads-page">
    <div className="downloads-titlebar" aria-hidden="true" />
    <main className="downloads-main">
      <nav className="downloads-nav" aria-label="Gezinme"><button onClick={() => void act(() => getApi().hideLibrary())}>← Siteye dön</button><button onClick={() => void act(() => getApi().showLibrary())}>Kütüphane ↗</button></nav>
      <header className="downloads-heading"><div><span className="downloads-eyebrow">ÇEVRİMDIŞI İZLEME</span><h1>İndirmeler<span>.</span></h1><p>Sevdiğin hikâyeler, her zaman yanında.</p></div><div className="downloads-heading-icon"><DownloadIcon /></div></header>
      <section className="downloads-stats" aria-label="İndirme özeti"><div><span>Devam eden</span><strong>{active.length}<small> bölüm</small></strong></div><div><span>İzlemeye hazır</span><strong>{completed.length}<small> bölüm</small></strong></div><div><span>İndirilen boyut</span><strong>{bytes(completed.reduce((sum, i) => sum + i.totalBytes, 0))}</strong></div></section>
      <div className="downloads-toolbar"><div className="downloads-filters" aria-label="Durum filtreleri">{filters.map(([key, label]) => <button key={key} aria-pressed={filter === key} onClick={() => setFilter(key)}>{label}</button>)}</div><input type="search" aria-label="İndirmelerde ara" placeholder="İndirmelerde ara…" value={search} onChange={e => setSearch(e.target.value)} /></div>
      <div className="downloads-list-heading"><span>{visible.length} bölüm</span><div><button disabled={busy || !items.some(i => i.status === 'paused' || i.status === 'failed')} onClick={() => void act(async () => { for (const i of items.filter(i => i.status === 'paused' || i.status === 'failed')) await getApi().resumeDownload(i.id); })}>Tümünü devam ettir</button><button disabled={busy || !items.some(i => i.status === 'downloading' || i.status === 'queued')} onClick={() => void act(async () => { for (const i of [...items.filter(i => i.status === 'queued'), ...items.filter(i => i.status === 'downloading')]) await getApi().pauseDownload(i.id); })}>Tümünü duraklat</button></div></div>
      {error && <div className="downloads-error" role="alert">{error} <button onClick={() => void refresh()}>Tekrar dene</button></div>}
      {loading ? <div className="downloads-empty" role="status">İndirmeler yükleniyor…</div> : visible.length === 0 ? <div className="downloads-empty"><DownloadIcon /><h2>{items.length ? 'Eşleşen indirme yok' : 'Henüz indirme yok'}</h2><p>{items.length ? 'Aramanı veya durum filtresini değiştirebilirsin.' : 'Bir anime sayfasından bölüm indirerek çevrimdışı izlemeye başlayabilirsin.'}</p></div> : <div className="downloads-list">{visible.map(item => {
        const percent = Math.max(0, Math.min(100, item.progressPercent || 0));
        return <article className={`download-card ${item.status}`} key={item.id}>
          <div className="download-art"><DownloadIcon /></div><div className="download-detail"><div className="download-card-heading"><h2>{item.title}</h2><span className={`download-status ${item.status}`}>{labels[item.status]}</span></div>
            {item.status !== 'completed' && <progress aria-label={`${item.title} indirme ilerlemesi`} max="100" value={percent} />}
            <div className="download-meta"><span>{item.status === 'completed' ? `${bytes(item.totalBytes)} · Çevrimdışı izlemeye hazır` : `${bytes(item.downloadedBytes)} / ${item.totalBytes ? bytes(item.totalBytes) : 'Boyut bekleniyor'}`}</span><span>{item.status === 'downloading' && `${bytes(item.speedBps)}/sn · `}{item.status !== 'completed' && `%${Math.floor(percent)}`}</span></div>
          </div><div className="download-actions">{item.status === 'completed' ? <button className="download-play" disabled={busy} onClick={() => void act(() => getApi().playOfflineEpisode(item.episodeId))}>▶ İzle</button> : <button disabled={busy} onClick={() => void act(() => item.status === 'downloading' || item.status === 'queued' ? getApi().pauseDownload(item.id) : getApi().resumeDownload(item.id))}>{item.status === 'downloading' || item.status === 'queued' ? 'Duraklat' : item.status === 'failed' ? 'Tekrar dene' : 'Devam et'}</button>}<button className="download-delete" disabled={busy} title="İndirmeyi sil" aria-label={`${item.title} indirmesini sil`} onClick={() => setPending(item)}><TrashIcon /></button></div>
        </article>;
      })}</div>}
      <footer className="downloads-footer">İndirmeler uygulama açık olduğu sürece arka planda devam eder.</footer>
    </main>
    {pending && <DeleteConfirmation title={pending.title} onClose={() => setPending(null)} onConfirm={async () => { await getApi().deleteDownload(pending.episodeId); await refresh(); }} />}
  </div>;
}
