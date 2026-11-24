import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Ranking = { teamName: string; totalPoints: number; rank: number };

export default function Leaderboard() {
  const [leaderboard, setLeaderboard] = useState<Ranking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ leaderboard: Ranking[] }>('/api/leaderboard')
      .then((data) => setLeaderboard(data.leaderboard))
      .catch(() => setError('Unable to load leaderboard'))
      .finally(() => setLoading(false));
  }, []);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Leaderboard</h2>
    {loading && <p role="status">Loading leaderboard...</p>}
    {!loading && error && <p role="alert">{error}</p>}
    {!loading && !error && leaderboard.length === 0 && <p>No leaderboard rankings yet.</p>}
    {!loading && !error && leaderboard.length > 0 && <ol>{leaderboard.map((ranking) =>
      <li key={ranking.rank}>{ranking.teamName}: {ranking.totalPoints} points</li>
    )}</ol>}
  </div></section>;
}
