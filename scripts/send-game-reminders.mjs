import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const vkToken = process.env.VK_COMMUNITY_TOKEN;

if (!vkToken) throw new Error('VK_COMMUNITY_TOKEN is not set');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

// Tomsk is UTC+7
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

async function main() {
  const tomorrow = getTomorrowTomsk();
  console.log(`Looking for games on: ${tomorrow} (Tomsk UTC+7)`);

  const clientsSnap = await db.collection('clients').get();
  const tomorrowGames = clientsSnap.docs
    .map(d => ({ id: d.id, ...d.data() }))
    .filter(c => c.data && getDateTomsk(c.data) === tomorrow);

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

  let sent = 0;
  let skipped = 0;

  for (const game of tomorrowGames) {
    const { quest, data: gameData, admin: operatorName, actor: actorName } = game;
    const gameDate = new Date(Number(gameData) + TOMSK_OFFSET_MS);
    const hours = String(gameDate.getUTCHours()).padStart(2, '0');
    const minutes = String(gameDate.getUTCMinutes()).padStart(2, '0');
    const timeStr = ` в ${hours}:${minutes}`;

    // Notify operator
    if (!operatorName) {
      console.warn(`[${quest}] operator name is empty — skipping`);
    } else {
      const opUser = userMap.get(operatorName);
      if (!opUser) {
        console.warn(`[${quest}] operator "${operatorName}" not found in schedules — skipping`);
        skipped++;
      } else if (!opUser.vkId) {
        console.warn(`[${quest}] operator "${operatorName}" has no vkId — skipping`);
        skipped++;
      } else {
        const actorLine = actorName ? `Актёр: ${actorName}.` : 'Актёр пока не назначен.';
        const message =
          `Привет, ${operatorName}! Напоминаем: завтра у тебя игра.\n` +
          `Квест: ${quest}${timeStr}.\n` +
          `${actorLine}`;
        try {
          await sendVkMessage(opUser.vkId, message);
          console.log(`✓ оператор ${operatorName} (vkId: ${opUser.vkId}) — ${quest}${timeStr}`);
          sent++;
        } catch (err) {
          console.error(`✗ оператор ${operatorName}: ${err.message}`);
        }
      }
    }

    // Notify actor
    if (!actorName) {
      console.warn(`[${quest}] actor name is empty — skipping`);
    } else {
      const actorUser = userMap.get(actorName);
      if (!actorUser) {
        console.warn(`[${quest}] actor "${actorName}" not found in schedules — skipping`);
        skipped++;
      } else if (!actorUser.vkId) {
        console.warn(`[${quest}] actor "${actorName}" has no vkId — skipping`);
        skipped++;
      } else {
        const operatorLine = operatorName ? `Админ: ${operatorName}.` : 'Оператор пока не назначен.';
        const message =
          `Привет, ${actorName}! Напоминаем: завтра у тебя игра.\n` +
          `Квест: ${quest}${timeStr}.\n` +
          `${operatorLine}`;
        try {
          await sendVkMessage(actorUser.vkId, message);
          console.log(`✓ актёр ${actorName} (vkId: ${actorUser.vkId}) — ${quest}${timeStr}`);
          sent++;
        } catch (err) {
          console.error(`✗ актёр ${actorName}: ${err.message}`);
        }
      }
    }
  }

  console.log(`Done. Sent: ${sent}, skipped: ${skipped}`);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
