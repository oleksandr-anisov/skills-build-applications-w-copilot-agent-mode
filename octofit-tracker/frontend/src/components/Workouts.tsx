import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Suggestion = { title: string; reason: string };

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ suggestions: Suggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent('mona@example.com')}`)
      .then((data) => setSuggestions(data.suggestions))
      .catch(() => setError('Unable to load workout suggestions'))
      .finally(() => setLoading(false));
  }, []);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Workout suggestions</h2>
    {loading && <p role="status">Loading workout suggestions...</p>}
    {!loading && error && <p role="alert">{error}</p>}
    {!loading && !error && suggestions.length === 0 && <p>No workout suggestions yet.</p>}
    {!loading && !error && suggestions.length > 0 && <ul>{suggestions.map((suggestion, index) =>
      <li key={index}><strong>{suggestion.title}</strong>{suggestion.reason ? ` - ${suggestion.reason}` : ''}</li>
    )}</ul>}
  </div></section>;
}
