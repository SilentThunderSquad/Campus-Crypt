import { useEffect, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import './styles/auth-shell.css';
import { CommunityFeedPage } from './pages/community/CommunityFeedPage';
import { UniversityPage } from './pages/university/UniversityPage';
import { ProfilePage } from './pages/profile/ProfilePage';
import { parseAppRoute } from './routes';

const guestState = {
  id: null,
  name: 'Guest Visitor',
  email: 'guest@campuscrypt.dev',
  role: 'guest',
  verificationStatus: 'unverified',
};

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL ?? '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? '';
const supabase = supabaseUrl && supabaseAnonKey
  ? createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    })
  : null;

function App() {
  const [session, setSession] = useState(null);
  const [backendUser, setBackendUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState('');
  const [route, setRoute] = useState(() => parseAppRoute(window.location.pathname));

  useEffect(() => {
    const handlePopState = () => {
      setRoute(parseAppRoute(window.location.pathname));
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      setStatusMessage('Supabase Auth is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.');
      return undefined;
    }

    let isMounted = true;

    const applySession = async (nextSession) => {
      if (!isMounted) {
        return;
      }

      setSession(nextSession);
      setLoading(false);

      if (!nextSession?.access_token) {
        setBackendUser(null);
        setStatusMessage('Guest access active');
        return;
      }

      try {
        const response = await fetch(`${apiBase}/api/auth/session`, {
          headers: {
            Authorization: `Bearer ${nextSession.access_token}`,
          },
          credentials: 'include',
        });

        const data = await response.json();
        if (data.authenticated && data.user) {
          setBackendUser(data.user);
          setStatusMessage(`Authenticated as ${data.user.name}`);
        } else {
          setBackendUser(null);
          setStatusMessage('Guest access active');
        }
      } catch (error) {
        setBackendUser(null);
        setStatusMessage('Unable to verify your backend session.');
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (isMounted) {
        applySession(data.session);
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      applySession(nextSession);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleGoogleLogin = async () => {
    if (!supabase) {
      setStatusMessage('Supabase Auth is not configured.');
      return;
    }

    setStatusMessage('Redirecting to Supabase Google sign-in...');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/`,
      },
    });

    if (error) {
      setStatusMessage(error.message || 'Google sign-in failed.');
    }
  };

  const handleLogout = async () => {
    if (!supabase) {
      setSession(null);
      setBackendUser(null);
      return;
    }

    const { error } = await supabase.auth.signOut();

    if (error) {
      setStatusMessage(error.message || 'Sign-out failed.');
      return;
    }

    setSession(null);
    setBackendUser(null);
    setStatusMessage('Logged out successfully');
  };

  if (route.page === 'feed') {
    return <CommunityFeedPage slug={route.slug} accessToken={session?.access_token} />;
  }

  if (route.page === 'university') {
    return <UniversityPage slug={route.slug} accessToken={session?.access_token} />;
  }

  if (route.page === 'profile') {
    return <ProfilePage username={route.username} />;
  }

  if (loading) {
    return <div className="auth-shell"><div className="auth-card"><h1>Loading auth state…</h1></div></div>;
  }

  const activeUser = backendUser ?? session?.user ?? guestState;
  const isAuthenticated = Boolean(backendUser || session?.user);

  return (
    <div className="auth-shell">
      <div className="auth-card">
        <div className="brand-row">
          <div className="logo-pill">CC</div>
          <span>Campus Crypt</span>
        </div>

        <div className="status-row">
          <span className={`status-badge ${isAuthenticated ? 'active' : 'guest'}`}>{isAuthenticated ? 'Authenticated' : 'Guest'}</span>
          <span className="status-text">{statusMessage}</span>
        </div>

        <div className="identity-panel">
          <p className="label">Current identity</p>
          <h1>{activeUser.name}</h1>
          <p>{activeUser.email}</p>
          <div className="meta-row">
            <span>Role: {activeUser.role}</span>
            <span>Verification: {activeUser.verificationStatus}</span>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="auth-actions">
            <button className="primary" onClick={handleGoogleLogin}>
              Continue with Google
            </button>
          </div>
        ) : (
          <div className="auth-actions">
            <button className="primary" onClick={() => fetch(`${apiBase}/api/auth/protected`, {
              headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
              credentials: 'include',
            }).then(async (res) => {
              const data = await res.json();
              setStatusMessage(data.message || 'Protected route check complete');
            })}>
              Check Protected Route
            </button>
            <button className="secondary" onClick={() => fetch(`${apiBase}/api/auth/verified-only`, {
              headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {},
              credentials: 'include',
            }).then(async (res) => {
              const data = await res.json();
              setStatusMessage(data.message || 'Verified route check complete');
            })}>
              Check Verified Route
            </button>
            <button className="ghost" onClick={handleLogout}>Logout</button>
          </div>
        )}

        <div className="feature-list">
          <div>
            <strong>Supabase Auth</strong>
            <span>Google OAuth via Supabase identity provider</span>
          </div>
          <div>
            <strong>Backend authorization</strong>
            <span>Current database state remains authoritative</span>
          </div>
          <div>
            <strong>Scoped foundation</strong>
            <span>Phase 1 identity and access controls only</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
