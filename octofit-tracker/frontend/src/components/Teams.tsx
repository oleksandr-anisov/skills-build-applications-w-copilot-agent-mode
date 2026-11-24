import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Team = { name: string; members?: string[] };

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    getJson<{ teams: Team[] }>('/api/teams')
      .then((data) => setTeams(data.teams))
      .catch(() => setError('Unable to load teams'))
      .finally(() => setLoading(false));
  }, []);

  return <section className="card h-100"><div className="card-body">
    <h2 className="h4">Teams</h2>
    {loading && <p role="status">Loading teams...</p>}
    {!loading && error && <p role="alert">{error}</p>}
    {!loading && !error && teams.length === 0 && <p>No teams yet.</p>}
    {!loading && !error && teams.length > 0 && <ul>{teams.map((team, index) =>
      <li key={index}>{team.name}{team.members?.length ? ` - ${team.members.length} members` : ''}</li>
    )}</ul>}
  </div></section>;
}
