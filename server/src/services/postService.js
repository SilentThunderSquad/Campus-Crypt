import { prisma } from '../config/db.js';
import { findUniversityBySlug } from './universityService.js';

const POST_MAX_LENGTH = 5000;
const publicAuthor = {
  id: true,
  name: true,
  profile: { select: { username: true, displayName: true, avatarUrl: true } },
};

function serializePost(post) {
  return {
    id: post.id,
    content: post.content,
    createdAt: post.createdAt,
    updatedAt: post.updatedAt,
    author: post.author,
    comments: post.comments ?? [],
  };
}

function validateContent(content) {
  const value = String(content ?? '').trim();
  if (!value || value.length > POST_MAX_LENGTH) {
    const error = new Error(`Post content must be between 1 and ${POST_MAX_LENGTH} characters.`);
    error.status = 400;
    throw error;
  }
  return value;
}

async function currentUser(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, verificationStatus: true, role: true },
  });
}

export async function createPost({ universitySlug, userId, content }) {
  const [university, user] = await Promise.all([
    findUniversityBySlug(universitySlug),
    currentUser(userId),
  ]);
  if (!university) return null;
  if (!user || user.verificationStatus !== 'verified') {
    const error = new Error('Verified users are required to create standalone posts.');
    error.status = 403;
    throw error;
  }

  const post = await prisma.post.create({
    data: { universityId: university.id, authorId: user.id, content: validateContent(content) },
    include: { author: { select: publicAuthor } },
  });
  return serializePost(post);
}

export async function updateOwnPost({ universitySlug, postId, userId, content }) {
  const university = await findUniversityBySlug(universitySlug);
  const post = await prisma.post.findUnique({
    where: { id: postId },
    select: { authorId: true, universityId: true },
  });
  if (!university || !post || post.universityId !== university.id || post.authorId !== userId) {
    const error = new Error('Post not found or you are not its author.');
    error.status = 403;
    throw error;
  }
  const updated = await prisma.post.update({
    where: { id: postId },
    data: { content: validateContent(content) },
    include: { author: { select: publicAuthor } },
  });
  return serializePost(updated);
}

export { POST_MAX_LENGTH, serializePost, publicAuthor };
