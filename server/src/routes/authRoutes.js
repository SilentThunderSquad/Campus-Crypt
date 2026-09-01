import { Router } from 'express';
import { env } from '../config/env.js';
import {
  getUserFromRequest,
  revokeSessionForRequest,
  resolveSupabaseAccessTokenFromRequest,
} from '../services/authService.js';
import { requireAdmin, requireAuth, requireVerifiedUser } from '../middleware/auth.js';

const router = Router();

function buildSupabaseGoogleRedirectUrl() {
  if (!env.supabaseUrl) {
    return null;
  }

  const authBase = new URL('/auth/v1/authorize', env.supabaseUrl.endsWith('/') ? env.supabaseUrl : `${env.supabaseUrl}/`);
  authBase.searchParams.set('provider', 'google');
  authBase.searchParams.set('redirect_to', `${env.clientOrigin}/auth/callback`);
  authBase.searchParams.set('scopes', 'openid email profile');

  return authBase.toString();
}

router.get('/health', (req, res) => {
  res.json({
    ok: true,
    service: 'campus-crypt-auth',
    authProvider: 'supabase',
  });
});

router.get('/session', async (req, res) => {
  const user = await getUserFromRequest(req);

  if (!user) {
    return res.json({ authenticated: false, user: null });
  }

  return res.json({
    authenticated: true,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      verificationStatus: user.verificationStatus,
      provider: user.provider,
    },
  });
});

router.get('/google', (req, res) => {
  const redirectUrl = buildSupabaseGoogleRedirectUrl();

  if (!redirectUrl) {
    return res.status(503).json({
      ok: false,
      message: 'Supabase Auth is not configured for this environment.',
    });
  }

  return res.redirect(redirectUrl);
});

router.get('/google/callback', async (req, res) => {
  return res.status(501).json({
    ok: false,
    message: 'Google OAuth is delegated to Supabase Auth. Configure the provider in Supabase and redirect to the Supabase callback flow.',
  });
});

router.post('/logout', async (req, res) => {
  const accessToken = resolveSupabaseAccessTokenFromRequest(req);
  await revokeSessionForRequest(req);

  if (accessToken) {
    return res.json({ ok: true, message: 'Logged out from the current Supabase session.' });
  }

  return res.json({ ok: true, message: 'No active Supabase session to revoke.' });
});

router.get('/profile', requireAuth, (req, res) => {
  res.json({
    ok: true,
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      verificationStatus: req.user.verificationStatus,
      provider: req.user.provider,
    },
  });
});

router.get('/protected', requireAuth, (req, res) => {
  res.json({
    ok: true,
    message: 'This protected route is accessible to authenticated users.',
    user: {
      id: req.user.id,
      name: req.user.name,
      role: req.user.role,
      verificationStatus: req.user.verificationStatus,
    },
  });
});

router.get('/verified-only', requireAuth, requireVerifiedUser, (req, res) => {
  res.json({
    ok: true,
    message: 'Verified user access granted.',
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      verificationStatus: req.user.verificationStatus,
    },
  });
});

router.get('/admin-only', requireAuth, requireAdmin, (req, res) => {
  res.json({
    ok: true,
    message: 'Admin access granted.',
    user: {
      id: req.user.id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      verificationStatus: req.user.verificationStatus,
    },
  });
});

export default router;
