import { prisma } from '../config/db.js';
import { findUniversityBySlug } from './universityService.js';
import { publicAuthor } from './postService.js';

const COMMENT_MAX_LENGTH = 2000;
const MAX_DEPTH = 3;
const MAX_COMMENTS = 100;

function validateContent(content) {
  const value = String(content ?? '').trim();
  if (!value || value.length > COMMENT_MAX_LENGTH) {
    const error = new Error(`Comment content must be between 1 and ${COMMENT_MAX_LENGTH} characters.`);
    error.status = 400;
    throw error;
  }
  return value;
}

function serializeComment(comment) {
  return {
    id: comment.id,
    postId: comment.postId,
    parentCommentId: comment.parentCommentId,
    content: comment.content,
    createdAt: comment.createdAt,
    updatedAt: comment.updatedAt,
    author: comment.author,
    replies: [],
  };
}

export function boundComments(comments, maxDepth = MAX_DEPTH) {
  const nodes = new Map(comments.map((comment) => [comment.id, serializeComment(comment)]));
  const roots = [];
  for (const node of nodes.values()) {
    const parent = node.parentCommentId ? nodes.get(node.parentCommentId) : null;
    if (!parent) roots.push(node);
    else if (getDepth(parent, nodes) < maxDepth) parent.replies.push(node);
  }
  return roots;
}

function getDepth(node, nodes) {
  let depth = 1;
  let cursor = node;
  while (cursor.parentCommentId && nodes.has(cursor.parentCommentId)) {
    depth += 1;
    cursor = nodes.get(cursor.parentCommentId);
  }
  return depth;
}

async function findPostForUniversity(slug, postId) {
  const university = await findUniversityBySlug(slug);
  if (!university) return null;
  const post = await prisma.post.findFirst({
    where: { id: postId, universityId: university.id },
    select: { id: true, universityId: true },
  });
  return post ? { university, post } : null;
}

export async function createComment({ universitySlug, postId, parentCommentId, userId, content }) {
  const target = await findPostForUniversity(universitySlug, postId);
  if (!target) {
    const error = new Error('Post not found in this university.');
    error.status = 404;
    throw error;
  }

  if (parentCommentId) {
    const parent = await prisma.comment.findFirst({
      where: { id: parentCommentId, postId, universityId: target.university.id },
      select: { id: true },
    });
    if (!parent) {
      const error = new Error('Reply parent does not belong to this post and university.');
      error.status = 400;
      throw error;
    }
  }

  const comment = await prisma.comment.create({
    data: {
      postId,
      universityId: target.university.id,
      authorId: userId,
      parentCommentId: parentCommentId || null,
      content: validateContent(content),
    },
    include: { author: { select: publicAuthor } },
  });
  return serializeComment(comment);
}

export async function getCommentsForPost({ universitySlug, postId }) {
  const target = await findPostForUniversity(universitySlug, postId);
  if (!target) return null;
  const comments = await prisma.comment.findMany({
    where: { postId, universityId: target.university.id },
    orderBy: { createdAt: 'asc' },
    take: MAX_COMMENTS,
    include: { author: { select: publicAuthor } },
  });
  return boundComments(comments);
}

export { COMMENT_MAX_LENGTH, MAX_COMMENTS, MAX_DEPTH, serializeComment };
