import { createClient } from '@supabase/supabase-js';
import { env } from '../config/env.js';
import {
  findUserByEmail,
  findUserById,
  findUserBySupabaseUserId,
  upsertUser,
} from '../config/db.js';

const normalizeEmail = (value) => String(value ?? '').trim().toLowerCase();

export function deriveSupabaseAuthReadiness(supabaseUser = {}) {
  const metadata = supabaseUser.user_metadata ?? {};
  const methods = [];

  const amr = Array.isArray(metadata.amr) ? metadata.amr : [];
  const factors = Array.isArray(metadata.factors) ? metadata.factors : [];

  for (const entry of [...amr, ...factors]) {
    if (typeof entry === 'string' && entry.trim()) {
      methods.push(entry.trim());
    }
  }

  const normalizedMethods = [...new Set(methods)];
  const hasMfa = Boolean(
    metadata.mfa_enabled ||
      metadata.mfaEnabled ||
      metadata.mfa_enrolled ||
      normalizedMethods.length > 0,
  );
  const hasPasskey = Boolean(
    metadata.webauthn ||
      metadata.passkey ||
      metadata.passkeys ||
      metadata.has_passkey ||
      metadata.webauthn_enabled,
  );

  return {
    source: 'supabase-auth',
    mfa: {
      enabled: hasMfa,
      methods: normalizedMethods,
    },
    passkey: {
      enabled: hasPasskey,
      ready: hasPasskey,
    },
  };
}

function getSupabaseClient() {
  if (!env.supabaseUrl || !env.supabaseAnonKey) {
    return null;
  }

  return createClient(env.supabaseUrl, env.supabaseAnonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function getSupabaseAdminClient() {
  if (!env.supabaseUrl || !env.supabaseServiceRoleKey) {
    return null;
  }

  return createClient(env.supabaseUrl, env.supabaseServiceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

export async function syncUserFromSupabaseIdentity(supabaseUser) {
  if (!supabaseUser?.id) {
    return null;
  }

  const email = normalizeEmail(supabaseUser.email);
  if (!email) {
    return null;
  }

  const existingUser = await findUserBySupabaseUserId(supabaseUser.id) ?? await findUserByEmail(email);
  const metadata = supabaseUser.user_metadata ?? {};
  const readiness = deriveSupabaseAuthReadiness(supabaseUser);
  const name = String(
    metadata.full_name ?? metadata.name ?? metadata.given_name ?? supabaseUser.email?.split('@')[0] ?? 'Campus Crypt User',
  ).trim();

  const appUser = await upsertUser({
    email,
    name: name || 'Campus Crypt User',
    role: existingUser?.role ?? 'student',
    verificationStatus: existingUser?.verificationStatus ?? 'unverified',
    provider: 'google',
    providerUserId: supabaseUser.id,
    supabaseUserId: supabaseUser.id,
    authMetadata: {
      ...metadata,
      campusCryptSecurity: readiness,
    },
    lastLoginAt: new Date(),
    lastLoginIp: null,
  });

  return appUser;
}

export async function verifySupabaseAccessToken(token) {
  if (!token) {
    return null;
  }

  const supabase = getSupabaseClient();
  if (!supabase) {
    return null;
  }

  try {
    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return null;
    }

    return syncUserFromSupabaseIdentity(data.user);
  } catch (error) {
    return null;
  }
}

export function resolveSupabaseAccessTokenFromRequest(req) {
  const authHeader = typeof req.headers?.authorization === 'string' ? req.headers.authorization : '';
  const headerToken = authHeader.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null;

  if (headerToken) {
    return headerToken;
  }

  const cookieEntries = req.cookies ?? {};
  const cookieName = Object.keys(cookieEntries).find(
    (key) => key.startsWith('sb-') && (key.endsWith('-auth-token') || key === 'sb-access-token'),
  );

  return cookieName ? String(cookieEntries[cookieName]) : null;
}

export async function getUserFromRequest(req) {
  const token = resolveSupabaseAccessTokenFromRequest(req);
  if (!token) {
    return null;
  }

  return verifySupabaseAccessToken(token);
}

export async function revokeSupabaseSession(token) {
  if (!token) {
    return false;
  }

  const supabase = getSupabaseAdminClient();
  if (!supabase) {
    return false;
  }

  try {
    const { error } = await supabase.auth.admin.signOut(token);
    return !error;
  } catch (error) {
    return false;
  }
}

export async function revokeSessionForRequest(req) {
  const token = resolveSupabaseAccessTokenFromRequest(req);
  return revokeSupabaseSession(token);
}

export async function createOrSyncUser({ email, name, role, verificationStatus, provider = 'google', providerUserId, supabaseUserId }) {
  return upsertUser({
    email,
    name,
    role,
    verificationStatus,
    provider,
    providerUserId,
    supabaseUserId,
  });
}

export function getUserByEmail(email) {
  return findUserByEmail(email);
}

export function getUserById(id) {
  return findUserById(id);
}
