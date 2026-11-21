import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { createComment, getCommentsForPost } from '../services/discussionService.js';

const router = Router();

router.get('/:slug/posts/:postId/comments', async (req, res) => {
  try {
    const comments = await getCommentsForPost({
      universitySlug: req.params.slug,
      postId: req.params.postId,
    });
    if (comments === null) return res.status(404).json({ ok: false, message: 'Post not found.' });
    return res.json({ ok: true, comments });
  } catch {
    return res.status(500).json({ ok: false, message: 'Unable to fetch discussion.' });
  }
});

router.post('/:slug/posts/:postId/comments', requireAuth, async (req, res) => {
  try {
    const comment = await createComment({
      universitySlug: req.params.slug,
      postId: req.params.postId,
      parentCommentId: req.body?.parentCommentId,
      userId: req.user.id,
      content: req.body?.content,
    });
    return res.status(201).json({ ok: true, comment });
  } catch (error) {
    return res.status(error.status ?? 500).json({
      ok: false,
      message: error.status ? error.message : 'Unable to create comment.',
    });
  }
});

export default router;
