import { initializeApp, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
const vkToken = process.env.VK_COMMUNITY_TOKEN;
const requestId = process.env.REQUEST_ID;

if (!vkToken) throw new Error('VK_COMMUNITY_TOKEN is not set');
if (!requestId) throw new Error('REQUEST_ID is not set');

initializeApp({ credential: cert(serviceAccount) });
const db = getFirestore();

const ROLE_LABELS = {
  admin: 'администратор',
  actor: 'актёр',
  operator: 'оператор',
};

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

function formatRequestDate(dateString) {
  return new Date(dateString).toLocaleDateString('ru-RU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
}

function buildChangedSlots(request) {
  const current = request.currentAvailability ?? {};
  const requested = request.requestedAvailability ?? {};
  const times = Array.from(new Set([...Object.keys(current), ...Object.keys(requested)])).sort();

  return times
    .filter((time) => current[time] !== requested[time])
    .map((time) => {
      const currentText =
        current[time] === true ? 'могу' : current[time] === false ? 'не могу' : 'не указано';
      const requestedText =
        requested[time] === true
          ? 'могу'
          : requested[time] === false
          ? 'не могу'
          : 'не указано';

      return `${time}: ${currentText} -> ${requestedText}`;
    });
}

async function main() {
  const settingsSnap = await db.collection('appSettings').doc('notifications').get();
  const scheduleChangeAdminUid = settingsSnap.data()?.scheduleChangeAdminUid;

  if (!scheduleChangeAdminUid) {
    console.log('No admin configured for schedule change alerts. Nothing to send.');
    return;
  }

  const requestSnap = await db.collection('scheduleChangeRequests').doc(requestId).get();
  if (!requestSnap.exists) {
    throw new Error(`Schedule change request not found: ${requestId}`);
  }

  const request = requestSnap.data();
  const adminSnap = await db.collection('schedules').doc(scheduleChangeAdminUid).get();
  if (!adminSnap.exists) {
    throw new Error(`Admin schedule profile not found: ${scheduleChangeAdminUid}`);
  }

  const admin = adminSnap.data();
  if (admin.isActive === false) {
    console.log('Configured admin is inactive. Nothing to send.');
    return;
  }
  if (!admin.vkId) {
    console.log('Configured admin has no vkId. Nothing to send.');
    return;
  }

  const roleLabel = ROLE_LABELS[request.userRole] ?? request.userRole;
  const changedSlots = buildChangedSlots(request);
  const slotsText =
    changedSlots.length > 0 ? changedSlots.join('\n') : 'Изменений по слотам не найдено.';

  const message =
    `Новый запрос на изменение расписания.\n` +
    `Сотрудник: ${request.userName} (${roleLabel}).\n` +
    `Дата: ${formatRequestDate(request.date)}.\n` +
    `Изменения:\n${slotsText}`;

  await sendVkMessage(admin.vkId, message);
  console.log(`Alert sent to admin ${admin.userName} for request ${requestId}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
