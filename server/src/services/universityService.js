import { prisma } from '../config/db.js';

export function normalizeUniversitySlug(value = '') {
  return String(value ?? '')
    .trim()
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function isValidUniversitySlug(value = '') {
  const slug = normalizeUniversitySlug(value);
  return slug.length >= 2 && slug.length <= 80 && /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export async function listUniversities() {
  const universities = await prisma.university.findMany({
    orderBy: { name: 'asc' },
    include: { memberships: true },
  });

  return universities.map((university) => ({
    ...university,
    memberCount: university.memberships.length,
  }));
}

export async function findUniversityBySlug(slug) {
  const normalizedSlug = normalizeUniversitySlug(slug);
  if (!normalizedSlug || !isValidUniversitySlug(normalizedSlug)) {
    return null;
  }

  const university = await prisma.university.findUnique({
    where: { slug: normalizedSlug },
    include: { memberships: true },
  });

  if (!university) {
    return null;
  }

  return {
    ...university,
    memberCount: university.memberships.length,
  };
}

export async function createUniversity({ name, slug, description }) {
  const safeName = String(name ?? '').trim();
  const safeSlug = normalizeUniversitySlug(slug);

  if (!safeName) {
    throw new Error('University name is required.');
  }

  if (!isValidUniversitySlug(safeSlug)) {
    throw new Error('University slug must be URL-safe and at least 2 characters long.');
  }

  return prisma.university.create({
    data: {
      name: safeName,
      slug: safeSlug,
      description: description ? String(description).trim() : null,
    },
    include: { memberships: true },
  });
}
