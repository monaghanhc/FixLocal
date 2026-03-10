import { Router } from 'express';
import { supabase } from '../lib/supabase.js';

const router = Router();

router.get('/leaderboard', async (req, res, next) => {
  try {
    const period = (req.query.period as string) ?? 'all';
    const view = period === 'weekly' ? 'leaderboard_weekly' : 'leaderboard_all_time';

    const { data, error } = await supabase
      .from(view)
      .select('user_id, report_count, rank')
      .order('rank', { ascending: true })
      .limit(20);

    if (error) throw error;

    // Anonymize user IDs - show only first 8 chars
    const anonymized = data?.map((row, index) => ({
      rank: row.rank,
      displayName: `User #${String(row.user_id).slice(0, 8)}`,
      reportCount: row.report_count,
      isCurrentUser: req.query.userId === row.user_id,
    })) ?? [];

    res.json({ period, leaderboard: anonymized });
  } catch (err) {
    next(err);
  }
});

export default router;
