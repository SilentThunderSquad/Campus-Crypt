import { Router } from 'express';
import { getUserProfileByUsername } from '../services/profileService.js';
import {
  normalizeUsername,
  isValidUsername,
  isReservedUsername,
  getUsernameErrorMessage,
} from '../validators/profileValidators.js';

const router = Router();

router.get('/:username', async (req, res) => {
  const username = normalizeUsername(req.params.username);

  if (isReservedUsername(username)) {
    return res.status(400).json({
      ok: false,
      message: getUsernameErrorMessage(username, 'reserved'),
    });
  }

  if (!username || !isValidUsername(username)) {
    return res.status(400).json({
      ok: false,
      message: 'Invalid username format.',
    });
  }

  try {
    const profile = await getUserProfileByUsername(username);

    if (!profile) {
      return res.status(404).json({
        ok: false,
        message: 'User profile not found.',
      });
    }

    return res.json({
      ok: true,
      profile,
    });
  } catch (error) {
    console.error('Error fetching user profile:', error);
    return res.status(500).json({
      ok: false,
      message: 'Unable to fetch user profile.',
    });
  }
});

export default router;
