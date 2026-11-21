import { Router } from 'express';
import { requireAuth, requireVerifiedUser } from '../middleware/auth.js';
import { createPost, updateOwnPost } from '../services/postService.js';

const router = Router();

router.post('/:slug/posts', requireAuth, requireVerifiedUser, async (req, res) => {
  try {
    const post = await createPost({
      universitySlug: req.params.slug,
      userId: req.user.id,
      content: req.body?.content,
    });
    if (!post) return res.status(404).json({ ok: false, message: 'University not found.' });
    return res.status(201).json({ ok: true, post });
  } catch (error) {
    return res.status(error.status ?? 500).json({
      ok: false,
      message: error.status ? error.message : 'Unable to create post.',
    });
  }
});

router.patch('/:slug/posts/:postId', requireAuth, async (req, res) => {
  try {
    const post = await updateOwnPost({
      universitySlug: req.params.slug,
      postId: req.params.postId,
      userId: req.user.id,
      content: req.body?.content,
    });
    return res.json({ ok: true, post });
  } catch (error) {
    return res.status(error.status ?? 500).json({
      ok: false,
      message: error.status ? error.message : 'Unable to update post.',
    });
  }
});

export default router;
