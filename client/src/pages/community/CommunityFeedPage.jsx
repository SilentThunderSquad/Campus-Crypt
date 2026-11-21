import { useEffect, useState } from 'react';

const apiBase = import.meta.env.VITE_API_URL ?? 'http://localhost:4000';

async function request(path, accessToken, options = {}) {
  const headers = { 'Content-Type': 'application/json', ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}) };
  const response = await fetch(`${apiBase}${path}`, { ...options, headers, credentials: 'include' });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || 'Request failed.');
  return body;
}

function CommentTree({ comments, onReply, canReply }) {
  return comments.map((comment) => (
    <div className="comment" key={comment.id}>
      <div className="comment-meta">
        <strong>{comment.author?.profile?.displayName || comment.author?.name}</strong>
        <span>{new Date(comment.createdAt).toLocaleString()}</span>
      </div>
      <p>{comment.content}</p>
      {canReply && (
        <button type="button" onClick={() => onReply(comment.id)}>Reply</button>
      )}
      {comment.replies?.length > 0 && (
        <div className="replies"><CommentTree comments={comment.replies} onReply={onReply} canReply={canReply} /></div>
      )}
    </div>
  ));
}

export function CommunityFeedPage({ slug, accessToken }) {
  const [feed, setFeed] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [postText, setPostText] = useState('');
  const [reply, setReply] = useState({ postId: null, parentCommentId: null, text: '' });
  const [edit, setEdit] = useState({ postId: null, text: '' });
  const [actionError, setActionError] = useState(null);

  const loadFeed = async () => {
    setLoading(true);
    setError(null);
    try {
      setFeed(await request(`/api/universities/${encodeURIComponent(slug)}/feed`, accessToken));
    } catch (err) {
      setError(err.message || 'Unable to load community feed.');
      setFeed(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { if (slug) loadFeed(); }, [slug, accessToken]);

  const submitPost = async (event) => {
    event.preventDefault();
    try {
      await request(`/api/universities/${encodeURIComponent(slug)}/posts`, accessToken, {
        method: 'POST', body: JSON.stringify({ content: postText }),
      });
      setPostText('');
      await loadFeed();
    } catch (err) { setActionError(err.message); }
  };

  const submitReply = async (event) => {
    event.preventDefault();
    try {
      await request(`/api/universities/${encodeURIComponent(slug)}/posts/${reply.postId}/comments`, accessToken, {
        method: 'POST',
        body: JSON.stringify({ content: reply.text, parentCommentId: reply.parentCommentId }),
      });
      setReply({ postId: null, parentCommentId: null, text: '' });
      await loadFeed();
    } catch (err) { setActionError(err.message); }
  };

  const submitEdit = async (event) => {
    event.preventDefault();
    try {
      await request(`/api/universities/${encodeURIComponent(slug)}/posts/${edit.postId}`, accessToken, {
        method: 'PATCH', body: JSON.stringify({ content: edit.text }),
      });
      setEdit({ postId: null, text: '' });
      await loadFeed();
    } catch (err) { setActionError(err.message); }
  };

  if (loading) return <div className="community-feed-page"><div className="container"><p>Loading community feed...</p></div></div>;
  if (error) return <div className="community-feed-page"><div className="container"><div className="error-state">{error}</div></div></div>;
  if (!feed) return null;

  const canReply = Boolean(feed.capabilities?.canReply);
  return (
    <div className="community-feed-page">
      <div className="container">
        <header className="feed-header">
          <h1>{feed.university.name}</h1>
          {feed.university.description && <p className="university-description">{feed.university.description}</p>}
        </header>
        {actionError && <div className="error-state">{actionError}</div>}
        {feed.capabilities?.canCreatePost && (
          <form className="composer" onSubmit={submitPost}>
            <label htmlFor="post-content">Create a post</label>
            <textarea id="post-content" value={postText} onChange={(event) => setPostText(event.target.value)} maxLength={5000} required />
            <button type="submit">Publish post</button>
          </form>
        )}
        <section className="feed-section">
          {feed.items?.length ? feed.items.map((item) => (
            <article className="feed-item" key={item.id}>
              <div className="post-meta">
                <a href={item.author?.profile?.username ? `/profile/${item.author.profile.username}` : '#'}>
                  {item.author?.profile?.displayName || item.author?.name}
                </a>
                <time dateTime={item.createdAt}>{new Date(item.createdAt).toLocaleString()}</time>
              </div>
              {item.type === 'review' ? (
                <div className="review-feed-item">
                  <strong>University review</strong>
                  {item.text && <p>{item.text}</p>}
                  <p>{Object.entries(item.ratings || {}).map(([category, score]) => `${category}: ${score}`).join(' · ')}</p>
                </div>
              ) : (
                <>
              {edit.postId === item.id ? (
                <form onSubmit={submitEdit}><textarea value={edit.text} onChange={(event) => setEdit({ ...edit, text: event.target.value })} maxLength={5000} required /><button type="submit">Save post</button></form>
              ) : <p className="post-content">{item.content}</p>}
              {item.canEdit && edit.postId !== item.id && <button type="button" onClick={() => setEdit({ postId: item.id, text: item.content })}>Edit post</button>}
              {canReply && (
                <button type="button" onClick={() => setReply({ postId: item.id, parentCommentId: null, text: '' })}>Reply</button>
              )}
              {reply.postId === item.id && (
                <form onSubmit={submitReply} className="reply-form"><textarea value={reply.text} onChange={(event) => setReply({ ...reply, text: event.target.value })} maxLength={2000} required /><button type="submit">Post reply</button></form>
              )}
              <div className="discussion"><CommentTree comments={item.comments || []} canReply={canReply} onReply={(parentCommentId) => setReply({ postId: item.id, parentCommentId, text: '' })} /></div>
                </>
              )}
            </article>
          )) : <div className="empty-feed-state"><p>No community activity yet.</p></div>}
        </section>
      </div>
      <style>{`
        .community-feed-page { padding: 2rem 1rem; min-height: 100vh; background: #f8f9fa; }
        .container { max-width: 800px; margin: 0 auto; } .feed-header { margin-bottom: 2rem; }
        .feed-header h1 { margin: 0 0 .5rem; } .university-description { color: #666; }
        .feed-section, .composer { background: white; border-radius: 8px; padding: 1.5rem; margin-bottom: 1rem; box-shadow: 0 2px 4px #00000012; }
        .feed-item { padding: 1rem 0; border-bottom: 1px solid #eee; } .post-meta, .comment-meta { display: flex; gap: .75rem; align-items: center; color: #666; font-size: .9rem; }
        .post-meta a { color: #2457a6; font-weight: 600; } textarea { display: block; width: 100%; min-height: 80px; margin: .5rem 0; box-sizing: border-box; }
        button { margin: .25rem .5rem .25rem 0; } .comment { border-left: 2px solid #eee; padding: .5rem 0 .5rem 1rem; }
        .replies { margin-left: 1rem; } .error-state { padding: 1rem; color: #a00; background: #fee; border: 1px solid #fcc; margin-bottom: 1rem; }
        .empty-feed-state { text-align: center; padding: 2rem; color: #666; }
      `}</style>
    </div>
  );
}
