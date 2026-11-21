import { useEffect, useState } from 'react';

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

export function UniversityPage({ slug, accessToken }) {
  const [university, setUniversity] = useState(null);
  const [membership, setMembership] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [reviewData, setReviewData] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRatings, setReviewRatings] = useState({
    academics: 5,
    facilities: 5,
    campus_life: 5,
    value: 5,
  });

  const requestHeaders = accessToken
    ? { Authorization: `Bearer ${accessToken}` }
    : {};

  const loadUniversity = async () => {
    setLoading(true);
    setError(null);

    try {
      const [detailResponse, membershipResponse, reviewResponse] = await Promise.all([
        fetch(`${apiBase}/api/universities/${encodeURIComponent(slug)}`, {
          headers: requestHeaders,
          credentials: 'include',
        }),
        fetch(`${apiBase}/api/universities/${encodeURIComponent(slug)}/membership-status`, {
          headers: requestHeaders,
          credentials: 'include',
        }),
        fetch(`${apiBase}/api/universities/${encodeURIComponent(slug)}/reviews`, {
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
      if (reviewResponse.ok) {
        setReviewData(await reviewResponse.json());
      } else {
        setReviewData(null);
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

  const submitReview = async (event) => {
    event.preventDefault();
    setActionLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${apiBase}/api/universities/${encodeURIComponent(slug)}/reviews`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...requestHeaders },
          credentials: 'include',
          body: JSON.stringify({ text: reviewText, ratings: reviewRatings }),
        },
      );
      const body = await response.json();
      if (!response.ok) {
        setError(body.message || 'Unable to submit university review.');
        return;
      }
      setReviewText('');
      await loadUniversity();
    } catch {
      setError('Network error. Unable to submit university review.');
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

        <section className="review-aggregates">
          <h2>University ratings</h2>
          {reviewData ? (
            <>
              <p><strong>Overall:</strong> {reviewData.aggregates.overall ?? 'No ratings'} ({reviewData.aggregates.reviewCount} reviews)</p>
              <div>
                {Object.entries(reviewData.aggregates.categories).map(([category, value]) => (
                  <span className="category-score" key={category}>
                    {category.replace('_', ' ')}: {value.average ?? 'No ratings'} ({value.count})
                  </span>
                ))}
              </div>
            </>
          ) : <p>Ratings are unavailable.</p>}
        </section>

        {membership?.isAuthenticated && (
          <section className="review-composer">
            <h2>Write a review</h2>
            {membership.canJoin || membership.canLeave ? (
              <form onSubmit={submitReview}>
                <textarea
                  value={reviewText}
                  onChange={(event) => setReviewText(event.target.value)}
                  maxLength={5000}
                  placeholder="Share an optional review"
                />
                {Object.keys(reviewRatings).map((category) => (
                  <label key={category}>
                    {category.replace('_', ' ')}
                    <select
                      value={reviewRatings[category]}
                      onChange={(event) => setReviewRatings((current) => ({
                        ...current,
                        [category]: Number(event.target.value),
                      }))}
                    >
                      {[1, 2, 3, 4, 5].map((score) => <option key={score} value={score}>{score}</option>)}
                    </select>
                  </label>
                ))}
                <button type="submit" disabled={actionLoading}>
                  {actionLoading ? 'Submitting...' : 'Submit review'}
                </button>
              </form>
            ) : <p>Verified status is required to submit a review.</p>}
          </section>
        )}

        {!membership?.isAuthenticated && (
          <section className="review-composer"><p>Sign in to submit a review. Public ratings remain available.</p></section>
        )}

        <section className="public-reviews">
          <h2>Public reviews</h2>
          {reviewData?.reviews?.length ? reviewData.reviews.map((review) => (
            <article className="public-review" key={review.id}>
              <strong>{review.author?.profile?.displayName || review.author?.name}</strong>
              {review.text && <p>{review.text}</p>}
              <p>{Object.entries(review.ratings).map(([category, score]) => `${category}: ${score}`).join(' · ')}</p>
            </article>
          )) : <p>No public reviews yet.</p>}
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
