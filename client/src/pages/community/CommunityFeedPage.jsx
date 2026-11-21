import { useState, useEffect } from 'react';

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export function CommunityFeedPage({ slug, accessToken }) {
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchFeed = async () => {
      setLoading(true);
      setError(null);

      try {
        const headers = accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {};
        const response = await fetch(`${apiBase}/api/universities/${encodeURIComponent(slug)}/feed`, {
          headers,
          credentials: 'include',
        });

        if (!response.ok) {
          if (response.status === 404) {
            setError('University not found.');
          } else if (response.status === 401 || response.status === 403) {
            setError('You are not authorized to view this community feed.');
          } else {
            setError('Unable to load community feed.');
          }
          setFeed(null);
          return;
        }

        const data = await response.json();
        if (data.ok) {
          setFeed(data);
        } else {
          setError(data.message || 'Unable to load community feed.');
          setFeed(null);
        }
      } catch (err) {
        console.error('Error fetching community feed:', err);
        setError('Network error. Unable to load community feed.');
        setFeed(null);
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchFeed();
    }
  }, [slug, accessToken]);

  if (loading) {
    return (
      <div className="community-feed-page">
        <div className="container">
          <p>Loading community feed...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="community-feed-page">
        <div className="container">
          <div className="error-state">
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  if (!feed) {
    return (
      <div className="community-feed-page">
        <div className="container">
          <p>Unable to load community feed.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="community-feed-page">
      <div className="container">
        <div className="feed-header">
          <h1>{feed.university.name}</h1>
          {feed.university.description && (
            <p className="university-description">{feed.university.description}</p>
          )}
        </div>

        <div className="feed-section">
          {feed.items && feed.items.length > 0 ? (
            <div className="feed-items">
              {feed.items.map((item) => (
                <div key={item.id} className="feed-item">
                  {/* Phase 3+ content will populate feed items */}
                  {item.content}
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-feed-state">
              <p>No community activity yet.</p>
              <p className="empty-feed-hint">
                Community discussions, posts, and reviews will appear here as members participate.
              </p>
            </div>
          )}
        </div>
      </div>

      <style>{`
        .community-feed-page {
          padding: 2rem 1rem;
          min-height: 100vh;
          background-color: #f8f9fa;
        }

        .container {
          max-width: 800px;
          margin: 0 auto;
        }

        .feed-header {
          margin-bottom: 2rem;
        }

        .feed-header h1 {
          font-size: 2rem;
          margin: 0 0 0.5rem 0;
          color: #1a1a1a;
        }

        .university-description {
          color: #666;
          margin: 0;
          font-size: 1.1rem;
        }

        .feed-section {
          background-color: white;
          border-radius: 8px;
          padding: 2rem;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
        }

        .feed-items {
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }

        .feed-item {
          padding: 1rem;
          border-bottom: 1px solid #eee;
        }

        .empty-feed-state {
          text-align: center;
          padding: 2rem 0;
          color: #666;
        }

        .empty-feed-state p {
          margin: 0.5rem 0;
        }

        .empty-feed-hint {
          font-size: 0.95rem;
          color: #999;
        }

        .error-state {
          background-color: #fee;
          border: 1px solid #fcc;
          border-radius: 8px;
          padding: 1rem;
          color: #c00;
          text-align: center;
        }
      `}</style>
    </div>
  );
}
