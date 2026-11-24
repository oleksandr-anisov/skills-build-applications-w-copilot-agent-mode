import { Activity, Team, User, Workout } from '../models/index.js';
import mongoose from 'mongoose';

function httpError(status: number, message: string) {
  return Object.assign(new Error(message), { status });
}

export async function listActivities() {
  return Activity.find().lean();
}

export async function createActivity(input: unknown) {
  if (!input || typeof input !== 'object') throw httpError(400, 'Invalid activity');
  const { userId, teamId, type, minutes } = input as { userId?: unknown; teamId?: unknown; type?: unknown; minutes?: unknown };
  if (typeof userId !== 'string' || typeof teamId !== 'string' || typeof type !== 'string' || typeof minutes !== 'number') {
    throw httpError(400, 'Invalid activity');
  }
  if (!mongoose.isValidObjectId(userId) || !mongoose.isValidObjectId(teamId) || !type.trim() || minutes < 1) {
    throw httpError(400, 'Invalid activity');
  }
  const [user, team] = await Promise.all([User.findById(userId), Team.findById(teamId)]);
  if (!user || !team) throw httpError(404, 'User or team not found');
  return Activity.create({
    user: user._id,
    team: team._id,
    type: type.trim(),
    minutes,
    points: minutes,
    occurredAt: new Date(),
  });
}

export async function listTeams() {
  return Team.find().lean();
}

export async function createTeam(input: unknown) {
  if (!input || typeof input !== 'object') throw httpError(400, 'Invalid team');
  const { name, mascot, members } = input as { name?: unknown; mascot?: unknown; members?: unknown };
  if (typeof name !== 'string' || !name.trim()) throw httpError(400, 'Team name is required');
  if (typeof mascot !== 'string' || !mascot.trim()) throw httpError(400, 'Team mascot is required');
  if (members !== undefined && !Array.isArray(members)) throw httpError(400, 'Invalid team members');
  const memberIds = Array.isArray(members) ? members : [];
  if (memberIds.some((id) => typeof id !== 'string' || !mongoose.isValidObjectId(id))) throw httpError(400, 'Invalid team member');
  if (memberIds.length) {
    const count = await User.countDocuments({ _id: { $in: memberIds } });
    if (count !== memberIds.length) throw httpError(404, 'Team member not found');
  }
  return Team.create({ name: name.trim(), mascot: mascot.trim(), members: memberIds });
}

export async function getLeaderboard() {
  const totals = await Activity.aggregate<{ _id: mongoose.Types.ObjectId; totalPoints: number }>([
    { $group: { _id: '$team', totalPoints: { $sum: '$points' } } },
  ]);
  const teams = await Team.find({ _id: { $in: totals.map((entry) => entry._id) } }).lean();
  const names = new Map(teams.map((team) => [team._id.toString(), team.name]));
  return totals
    .map((entry) => ({ teamName: names.get(entry._id.toString()) ?? 'Unknown team', totalPoints: entry.totalPoints, rank: 0 }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .map((entry, index) => ({ ...entry, rank: index + 1 }));
}

export async function suggestWorkouts(userEmail: string) {
  const user = await User.findOne({ email: decodeURIComponent(userEmail).trim().toLowerCase() });
  if (!user) throw httpError(404, 'User not found');
  const recent = await Activity.findOne({ user: user._id }).sort({ occurredAt: -1 }).lean();
  const recentFocus = recent?.type === 'run' ? 'endurance' : recent?.type === 'cycle' ? 'endurance' : recent?.type === 'strength' ? 'strength' : null;
  const focus = recentFocus ?? user.fitnessGoal;
  const matching = await Workout.find({ focus }).lean();
  const suggestions = matching.length ? matching : await Workout.find().lean();
  return suggestions.map((workout) => ({
    ...workout,
    reason: recent
      ? `Recommended for your recent ${recent.type} activity and ${focus} goal`
      : `Recommended to support your ${focus} fitness goal`,
  }));
}

export { User };
