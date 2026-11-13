import React, { useEffect, useRef, useState } from 'react';

export function TrashIcon() {
  return <svg aria-hidden="true" width="19" height="19" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13M10 11v5M14 11v5" /></svg>;
}

export function DeleteConfirmation({ title, onConfirm, onClose }: {
  title: string; onConfirm: () => Promise<void>; onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    dialog.current?.showModal();
    return () => { dialog.current?.close(); previous?.focus(); };
  }, []);
  const confirm = async () => {
    if (busy) return;
    setBusy(true);
    try { await onConfirm(); onClose(); }
    catch { setError('Silinemedi. Lütfen tekrar deneyin.'); setBusy(false); }
  };
  return <dialog ref={dialog} className="delete-dialog" aria-labelledby="delete-title" aria-describedby="delete-description" onCancel={(e) => { e.preventDefault(); if (!busy) onClose(); }}>
    <div className="delete-emblem"><TrashIcon /></div>
    <h2 id="delete-title">İndirme silinsin mi?</h2>
    <p className="delete-name">{title}</p>
    <p id="delete-description">İndirme ve cihazdaki ilgili dosyalar silinecek. İzlemek için bölümü yeniden indirmeniz gerekir.</p>
    {error && <p role="alert">{error}</p>}
    <div className="delete-actions"><button autoFocus disabled={busy} onClick={onClose}>Vazgeç</button><button className="danger" disabled={busy} onClick={() => void confirm()}>{busy ? 'Siliniyor…' : 'Evet, sil'}</button></div>
  </dialog>;
}
