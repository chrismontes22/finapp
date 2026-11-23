import { Suspense, lazy, useCallback, useEffect, useState } from 'react';
import { ProgressProvider } from './state/progress';
import { MoneyProvider } from './state/money';
import { useRoute } from './state/router';
import { introDueToday, markIntroSeen } from './state/intro';
import { GlossaryProvider } from './components/Glossary';
import { AppShell } from './components/AppShell';
import { Intro } from './components/Intro';
import { Home } from './pages/Home';
import { CHAPTER_COMPONENTS } from './chapters/registry';

const MyMoney = lazy(() => import('./pages/MyMoney'));

function PageLoading() {
  return (
    <div className="mx-auto max-w-5xl animate-pulse space-y-4 pt-6" aria-busy="true" aria-label="Loading">
      <div className="h-3 w-40 rounded-full bg-surface-3" />
      <div className="h-12 w-2/3 rounded-xl bg-surface-3" />
      <div className="h-4 w-1/2 rounded-full bg-surface-3" />
      <div className="mt-10 h-56 rounded-3xl bg-surface-2" />
    </div>
  );
}

function Routes() {
  const route = useRoute();
  const [intro, setIntro] = useState(false);
  const [revealKey, setRevealKey] = useState(0);

  // Auto-play on the home page at most once a day; #/intro replays it on demand.
  useEffect(() => {
    if (route.page === 'intro' || (route.page === 'home' && introDueToday())) {
      markIntroSeen();
      setIntro(true);
    }
  }, [route]);

  const onReveal = useCallback(() => setRevealKey((k) => k + 1), []);
  const onDone = useCallback(() => {
    setIntro(false);
    if (window.location.hash === '#/intro') window.location.replace('#/');
  }, []);

  let page;
  if (route.page === 'chapter') {
    const Page = CHAPTER_COMPONENTS[route.id];
    page = <Page key={route.id} />;
  } else if (route.page === 'money') {
    page = <MyMoney tab={route.tab} />;
  } else {
    page = <Home key={revealKey} />;
  }

  return (
    <>
      <AppShell route={route}>
        <Suspense fallback={<PageLoading />}>{page}</Suspense>
      </AppShell>
      {intro && <Intro onReveal={onReveal} onDone={onDone} />}
    </>
  );
}

export default function App() {
  return (
    <ProgressProvider>
      <MoneyProvider>
        <GlossaryProvider>
          <Routes />
        </GlossaryProvider>
      </MoneyProvider>
    </ProgressProvider>
  );
}
