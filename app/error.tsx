'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main
      style={{
        minHeight: '100vh',
        display: 'grid',
        placeItems: 'center',
        padding: '2rem',
        background: '#0b1f3a',
        color: '#f4e4c1',
        textAlign: 'center',
        gap: '1rem',
      }}
    >
      <h1>Ошибка загрузки</h1>
      <p>{error.message || 'Что-то пошло не так после транзакции.'}</p>
      <button
        type="button"
        onClick={() => reset()}
        style={{
          padding: '0.75rem 1.25rem',
          borderRadius: '0.5rem',
          border: 'none',
          background: '#9a6b2e',
          color: '#fff',
          fontWeight: 700,
          cursor: 'pointer',
        }}
      >
        Попробовать снова
      </button>
    </main>
  );
}
