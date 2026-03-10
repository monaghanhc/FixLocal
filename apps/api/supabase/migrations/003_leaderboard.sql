-- Leaderboard view: counts reports per user
CREATE OR REPLACE VIEW leaderboard_all_time AS
SELECT
  user_id,
  COUNT(*) AS report_count,
  RANK() OVER (ORDER BY COUNT(*) DESC) AS rank
FROM reports
GROUP BY user_id;

-- Weekly leaderboard (last 7 days)
CREATE OR REPLACE VIEW leaderboard_weekly AS
SELECT
  user_id,
  COUNT(*) AS report_count,
  RANK() OVER (ORDER BY COUNT(*) DESC) AS rank
FROM reports
WHERE created_at >= NOW() - INTERVAL '7 days'
GROUP BY user_id;
