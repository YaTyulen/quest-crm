import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const vkToken = process.env.VK_COMMUNITY_TOKEN;

if (!vkToken) throw new Error('VK_COMMUNITY_TOKEN is not set');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const TOMSK_OFFSET_MS = 7 * 60 * 60 * 1000;

function getTomorrowTomsk() {
  const now = new Date();
  const tomsk = new Date(now.getTime() + TOMSK_OFFSET_MS);
  tomsk.setUTCDate(tomsk.getUTCDate() + 1);
  return tomsk.toISOString().slice(0, 10);
}

function getDateTomsk(msString) {
  const tomsk = new Date(Number(msString) + TOMSK_OFFSET_MS);
  return tomsk.toISOString().slice(0, 10);
}

function getTimeTomsk(msString) {
  const tomsk = new Date(Number(msString) + TOMSK_OFFSET_MS);
  const hours = String(tomsk.getUTCHours()).padStart(2, '0');
  const minutes = String(tomsk.getUTCMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
}

async function sendVkMessage(userId, message) {
  const params = new URLSearchParams({
    user_id: String(userId),
    message,
    access_token: vkToken,
    random_id: String(Math.floor(Math.random() * 1e9)),
    v: '5.131',
  });
  const res = await fetch(`https://api.vk.com/method/messages.send?${params}`);
  const data = await res.json();
  if (data.error) throw new Error(`VK error ${data.error.error_code}: ${data.error.error_msg}`);
}

function addAssignment(assignmentMap, userName, role, game) {
  if (!userName) {
    console.warn(`[${game.quest}] ${role} name is empty - skipping`);
    return;
  }

  if (!assignmentMap.has(userName)) {
    assignmentMap.set(userName, []);
  }

  assignmentMap.get(userName).push({
    quest: game.quest,
    time: getTimeTomsk(game.data),
    counterpart: role === 'operator' ? game.actor : game.admin,
    counterpartLabel: role === 'operator' ? 'Актёр' : 'Админ',
    timestamp: Number(game.data),
  });
}

function buildMessage(userName, assignments) {
  const sortedAssignments = [...assignments].sort((a, b) => a.timestamp - b.timestamp);
  const gamesWord =
    sortedAssignments.length === 1
      ? 'игра'
      : sortedAssignments.length >= 2 && sortedAssignments.length <= 4
      ? 'игры'
      : 'игр';

  const lines = sortedAssignments.map((assignment, index) => {
    const counterpartText = assignment.counterpart
      ? `${assignment.counterpartLabel}: ${assignment.counterpart}`
      : `${assignment.counterpartLabel}: не назначен`;

    return `${index + 1}. ${assignment.time} - ${assignment.quest} (${counterpartText})`;
  });

  return (
    `Привет, ${userName}! Напоминаем: завтра у тебя ${sortedAssignments.length} ${gamesWord}.\n` +
    `${lines.join('\n')}`
  );
}

async function main() {
  const tomorrow = getTomorrowTomsk();
  console.log(`Looking for games on: ${tomorrow} (Tomsk UTC+7)`);

  const clientsSnap = await db.collection('clients').get();
  const tomorrowGames = clientsSnap.docs
    .map((d) => ({ id: d.id, ...d.data() }))
    .filter((c) => c.data && getDateTomsk(c.data) === tomorrow);

  if (tomorrowGames.length === 0) {
    console.log('No games tomorrow. Nothing to send.');
    return;
  }
  console.log(`Games tomorrow: ${tomorrowGames.length}`);

  const schedulesSnap = await db.collection('schedules').get();
  const userMap = new Map();
  for (const doc of schedulesSnap.docs) {
    const d = doc.data();
    if (d.userName) {
      userMap.set(d.userName, { userName: d.userName, vkId: d.vkId || null });
    }
  }

  const operatorAssignments = new Map();
  const actorAssignments = new Map();

  for (const game of tomorrowGames) {
    addAssignment(operatorAssignments, game.admin, 'operator', game);
    addAssignment(actorAssignments, game.actor, 'actor', game);
  }

  let sent = 0;
  let skipped = 0;

  const allAssignments = [
    ...[...operatorAssignments.entries()].map(([userName, assignments]) => ({
      userName,
      assignments,
      role: 'operator',
    })),
    ...[...actorAssignments.entries()].map(([userName, assignments]) => ({
      userName,
      assignments,
      role: 'actor',
    })),
  ];

  for (const { userName, assignments, role } of allAssignments) {
    const user = userMap.get(userName);
    if (!user) {
      console.warn(`[${role}] "${userName}" not found in schedules - skipping`);
      skipped++;
      continue;
    }

    if (!user.vkId) {
      console.warn(`[${role}] "${userName}" has no vkId - skipping`);
      skipped++;
      continue;
    }

    const message = buildMessage(userName, assignments);

    try {
      await sendVkMessage(user.vkId, message);
      console.log(
        `sent ${role} ${userName} (vkId: ${user.vkId}) - ${assignments.length} game(s)`
      );
      sent++;
    } catch (err) {
      console.error(`failed ${role} ${userName}: ${err.message}`);
    }
  }

  console.log(`Done. Sent: ${sent}, skipped: ${skipped}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
