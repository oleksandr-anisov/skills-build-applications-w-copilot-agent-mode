import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = { type: string; minutes: number; points: number };

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ activities: Activity[] }>('/api/activities')
      .then((data) => setActivities(data.activities))
      .catch(() => setError('Unable to load activities'))
      .finally(() => setLoading(false));
  }, []);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Activities</h2>
    {loading && <p role="status">Loading activities...</p>}
    {!loading && error && <p role="alert">{error}</p>}
    {!loading && !error && activities.length === 0 && <p>No activities yet.</p>}
    {!loading && !error && activities.length > 0 && <ul>{activities.map((activity, index) =>
      <li key={index}>{activity.type} - {activity.minutes} minutes, {activity.points} points</li>
    )}</ul>}
  </div></section>;
}
