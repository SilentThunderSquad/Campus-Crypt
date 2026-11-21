import { useEffect, useState } from 'react';

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export function UniversityPage({ slug, accessToken }) {
  const [university, setUniversity] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  const requestHeaders = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};

  const loadUniversity = async () => {
    setLoading(true);
    setError(null);

    try {
      const [detailResponse, membershipResponse] = await Promise.all([
        fetch(`${apiBase}/api/universities/${encodeURIComponent(slug)}`, {
          headers: requestHeaders,
          credentials: 'include',
        }),
        fetch(`${apiBase}/api/universities/${encodeURIComponent(slug)}/membership-status`, {
          headers: requestHeaders,
          credentials: 'include',
        }),
      ]);

      if (detailResponse.status === 400) {
        setError('Invalid university identifier.');
        setUniversity(null);
        setMembership(null);
        return;
      }

      if (detailResponse.status === 404) {
        setError('University not found.');
        setUniversity(null);
        setMembership(null);
        return;
      }

      if (!detailResponse.ok) {
        setError(detailResponse.status === 401 || detailResponse.status === 403
          ? 'You are not authorized to view this university.'
          : 'Unable to load university.');
        setUniversity(null);
        setMembership(null);
        return;
      }

      const detailBody = await detailResponse.json();
      setUniversity(detailBody.university);

      if (membershipResponse.ok) {
        const membershipBody = await membershipResponse.json();
        setMembership(membershipBody.membershipStatus);
      } else {
        setMembership(null);
      }
    } catch {
      setError('Network error. Unable to load university.');
      setUniversity(null);
      setMembership(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (slug) {
      loadUniversity();
    }
  }, [slug, accessToken]);

  const performMembershipAction = async (action) => {
    setActionLoading(true);
    setError(null);

    try {
      const response = await fetch(
        `${apiBase}/api/universities/${encodeURIComponent(slug)}/${action}`,
        {
          method: 'POST',
          headers: requestHeaders,
          credentials: 'include',
        },
      );
      const body = await response.json();

      if (!response.ok) {
        setError(body.message || 'Unable to update community membership.');
        return;
      }

      await loadUniversity();
    } catch {
      setError('Network error. Unable to update community membership.');
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="community-page-state">
        <p>Loading university...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="community-page-state">
        <div className="error-state">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  if (!university) {
    return (
      <div className="community-page-state">
        <p>University information is unavailable.</p>
      </div>
    );
  }

  return (
    <div className="university-page">
      <main className="container">
        <header className="university-header">
          <h1>{university.name}</h1>
          {university.description && <p>{university.description}</p>}
        </header>

        <section className="community-actions">
          {membership?.isAuthenticated ? (
            <>
              {membership.isMember && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => performMembershipAction('leave')}
                >
                  {actionLoading ? 'Leaving...' : 'Leave community'}
                </button>
              )}
              {!membership.isMember && membership.canJoin && (
                <button
                  type="button"
                  disabled={actionLoading}
                  onClick={() => performMembershipAction('join')}
                >
                  {actionLoading ? 'Joining...' : 'Join community'}
                </button>
              )}
              {!membership.isMember && !membership.canJoin && (
                <p>Verified status is required to join this community.</p>
              )}
            </>
          ) : (
            <p>Sign in to view membership actions.</p>
          )}
        </section>

        <section className="community-feed-link">
          <a href={`/u/${encodeURIComponent(university.slug)}/feed`}>
            View community feed
          </a>
        </section>
      </main>

      <style>{`
        .university-page, .community-page-state {
          min-height: 100vh;
          padding: 2rem 1rem;
          background: #f8f9fa;
        }
        .container { max-width: 800px; margin: 0 auto; }
        .university-header, .community-actions, .community-feed-link {
          background: white;
          border-radius: 8px;
          padding: 1.5rem;
          margin-bottom: 1rem;
        }
        .university-header h1 { margin-top: 0; }
        .community-actions button {
          border: 0;
          border-radius: 6px;
          background: #1f2937;
          color: white;
          padding: 0.75rem 1rem;
          cursor: pointer;
        }
        .community-actions button:disabled { opacity: 0.65; cursor: wait; }
        .error-state { background: #fee; border: 1px solid #fcc; border-radius: 8px; padding: 1rem; color: #c00; }
      `}</style>
    </div>
  );
}
