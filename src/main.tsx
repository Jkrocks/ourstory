import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import { StoreProvider } from './lib/store';
import { AuthProvider, useAuth } from './lib/auth';
import { FamilySetup, Login } from './screens/Login';
import { LikesProvider } from './lib/likes';

function Root() {
  const auth = useAuth();
  if (auth.phase === 'loading') {
    return <div className="grid min-h-screen place-items-center bg-paper font-display text-[28px] tracking-[.04em]" role="status">OurStory</div>;
  }
  if (auth.phase === 'signedOut') return <Login />;
  if (auth.phase === 'noFamily') return <FamilySetup />;
  return (
    <StoreProvider key={`${auth.mode}-${auth.family?.id ?? auth.seed}`}>
      <LikesProvider active={auth.mode === 'published'}>
        <App />
      </LikesProvider>
    </StoreProvider>
  );
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>,
);
