function safeDecode(value) {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
}

export function parseAppRoute(pathname) {
  const feedMatch = pathname.match(/^\/u\/([^/]+)\/feed\/?$/);
  if (feedMatch) {
    return {
      page: 'feed',
      slug: safeDecode(feedMatch[1]),
    };
  }

  const universityMatch = pathname.match(/^\/u\/([^/]+)\/?$/);
  if (universityMatch) {
    return {
      page: 'university',
      slug: safeDecode(universityMatch[1]),
    };
  }

  const profileMatch = pathname.match(/^\/profile\/([^/]+)\/?$/);
  if (profileMatch) {
    return {
      page: 'profile',
      username: safeDecode(profileMatch[1]),
    };
  }

  return { page: 'home' };
}
