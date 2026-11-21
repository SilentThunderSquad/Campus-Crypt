const RESERVED_USERNAMES = new Set([
  'admin',
  'api',
  'auth',
  'app',
  'console',
  'dashboard',
  'docs',
  'help',
  'home',
  'login',
  'logout',
  'profile',
  'settings',
  'signup',
  'u',
  'user',
  'users',
  'verify',
  'me',
  'system',
  'root',
  'moderator',
  'support',
  'contact',
  'about',
  'privacy',
  'terms',
  'tos',
  'faq',
  'blog',
  'news',
  'press',
  'careers',
]);

export function isValidUsername(username) {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    return false;
  }

  if (normalized.length < 3 || normalized.length > 32) {
    return false;
  }

  if (!/^[a-z0-9_-]+$/.test(normalized)) {
    return false;
  }

  if (/^-|-$|^_|_$/.test(normalized)) {
    return false;
  }

  if (RESERVED_USERNAMES.has(normalized)) {
    return false;
  }

  return true;
}

export function normalizeUsername(username) {
  if (!username || typeof username !== 'string') {
    return null;
  }

  return username.trim().toLowerCase();
}

export function isReservedUsername(username) {
  const normalized = normalizeUsername(username);
  if (!normalized) {
    return false;
  }

  return RESERVED_USERNAMES.has(normalized);
}

export function getUsernameErrorMessage(username, errorType = 'invalid') {
  if (errorType === 'too-short') {
    return 'Username must be at least 3 characters long.';
  }
  if (errorType === 'too-long') {
    return 'Username must be at most 32 characters long.';
  }
  if (errorType === 'invalid-chars') {
    return 'Username can only contain lowercase letters, numbers, hyphens, and underscores.';
  }
  if (errorType === 'invalid-start-end') {
    return 'Username cannot start or end with hyphens or underscores.';
  }
  if (errorType === 'reserved') {
    return 'This username is reserved and cannot be used.';
  }
  if (errorType === 'duplicate') {
    return 'This username is already taken.';
  }
  return 'Invalid username.';
}
