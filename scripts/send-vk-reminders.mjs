import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const vkToken = process.env.VK_COMMUNITY_TOKEN;

if (!vkToken) throw new Error('VK_COMMUNITY_TOKEN is not set');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

function formatDate(date) {
  return date.toISOString().slice(0, 10);
}

function getNext11Days() {
  const dates = [];
  const today = new Date();
  for (let i = 1; i <= 11; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() + i);
    dates.push(formatDate(d));
  }
  return dates;
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
  const next11Days = getNext11Days();
  console.log(`Checking schedule for dates: ${next11Days[0]} — ${next11Days[next11Days.length - 1]}`);

  const snap = await db.collection('schedules').get();

  const toNotify = [];
  for (const docSnap of snap.docs) {
    const data = docSnap.data();
    if (data.role === 'admin') continue;
    if (!data.vkId) continue;

    const availability = data.availability ?? {};
    const missingDays = next11Days.filter(date => {
      const dayData = availability[date];
      return !dayData || Object.keys(dayData).length === 0;
    });

    if (missingDays.length > 0) {
      toNotify.push({ userName: data.userName, vkId: data.vkId, missingDays });
    }
  }

  console.log(`Users to notify: ${toNotify.length}`);

  for (const { userName, vkId, missingDays } of toNotify) {
    const datesStr = missingDays
      .map(d => {
        const [, m, day] = d.split('-');
        return `${day}.${m}`;
      })
      .join(', ');
    const message =
      `Привет, ${userName}! Напоминаем: заполни расписание на ближайшие дни (${datesStr}). ` +
      `Зайди в приложение и отметь своё наличие 🙏`;
    try {
      await sendVkMessage(vkId, message);
      console.log(`✓ ${userName} (vkId: ${vkId})`);
    } catch (err) {
      console.error(`✗ ${userName} (vkId: ${vkId}): ${err.message}`);
    }
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
