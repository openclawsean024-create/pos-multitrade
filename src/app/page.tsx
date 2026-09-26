'use client';

import dynamic from 'next/dynamic';

// The workbench is fully client-side because it talks to IndexedDB.
const PosWorkbench = dynamic(() => import('@/components/PosWorkbench'), {
  ssr: false,
  loading: () => (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        background: 'var(--bg)',
        color: 'var(--muted)',
        font: '13px/1.45 ui-sans-serif,-apple-system,sans-serif',
      }}
      role="status"
      aria-label="Loading POS workbench"
    >
      Loading POS workbench…
    </div>
  ),
});

export default function HomePage() {
  return <PosWorkbench />;
}
