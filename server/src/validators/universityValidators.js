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

export function getUniversitySlugErrorMessage(errorType = 'invalid') {
  if (errorType === 'too-short') {
    return 'University slug must be at least 2 characters long.';
  }
  if (errorType === 'too-long') {
    return 'University slug must be at most 80 characters long.';
  }
  if (errorType === 'duplicate') {
    return 'University slug is already taken.';
  }
  return 'University slug must be URL-safe.';
}
