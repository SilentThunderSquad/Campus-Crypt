import { useEffect, useState } from 'react';

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';
const reservedUsernames = new Set([
  'admin', 'api', 'auth', 'app', 'console', 'dashboard', 'docs', 'help',
  'home', 'login', 'logout', 'profile', 'settings', 'signup', 'u', 'user',
  'users', 'verify', 'me', 'system', 'root', 'moderator', 'support',
  'contact', 'about', 'privacy', 'terms', 'tos', 'faq', 'blog', 'news',
  'press', 'careers',
]);

export function ProfilePage({ username }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const normalized = String(username ?? '').trim().toLowerCase();

    if (
      normalized.length < 3 ||
      normalized.length > 32 ||
      !/^[a-z0-9_-]+$/.test(normalized) ||
      /^-|-$|^_|_$/.test(normalized) ||
      reservedUsernames.has(normalized)
    ) {
      setLoading(false);
      setProfile(null);
      setError('Invalid username.');
      return;
    }

    const loadProfile = async () => {
      setLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `${apiBase}/api/users/${encodeURIComponent(normalized)}`,
          { credentials: 'include' },
        );

        if (response.status === 404) {
          setProfile(null);
          setError('User profile not found.');
          return;
        }

        if (response.status === 400) {
          setProfile(null);
          setError('Invalid username.');
          return;
        }

        if (!response.ok) {
          setProfile(null);
          setError('Unable to load profile.');
          return;
        }

        const body = await response.json();
        setProfile(body.profile);
      } catch {
        setProfile(null);
        setError('Network error. Unable to load profile.');
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, [username]);

  if (loading) {
    return <div className="profile-page-state"><p>Loading profile...</p></div>;
  }

  if (error) {
    return (
      <div className="profile-page-state">
        <div className="error-state"><p>{error}</p></div>
      </div>
    );
  }

  if (!profile) {
    return <div className="profile-page-state"><p>Profile unavailable.</p></div>;
  }

  return (
    <div className="profile-page">
      <main className="container">
        <h1>{profile.displayName}</h1>
        <p className="username">@{profile.username}</p>
        {profile.bio && <p>{profile.bio}</p>}
      </main>

      <style>{`
        .profile-page, .profile-page-state {
          min-height: 100vh;
          padding: 2rem 1rem;
          background: #f8f9fa;
        }
        .container {
          max-width: 800px;
          margin: 0 auto;
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
        }
        .username { color: #666; }
        .error-state {
          background: #fee;
          border: 1px solid #fcc;
          border-radius: 8px;
          padding: 1rem;
          color: #c00;
        }
      `}</style>
    </div>
  );
}
