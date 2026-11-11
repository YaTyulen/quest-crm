import { useEffect, useState } from 'react';
import { getNotificationSettings, saveNotificationSettings } from '../../api/notifications';
import './NotificationsPage.scss';

const message = (reason: unknown) => reason instanceof Error ? reason.message : 'Не удалось выполнить запрос.';
const recipientList = (value: string) => [...new Set(value.split(/[\s,;]+/).filter(Boolean).map(email => email.toLowerCase()))];

export default function NotificationsPage() {
  const [value, setValue] = useState('');
  const [saved, setSaved] = useState<string[]>([]);
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;
    setLoading(true); setError('');
    getNotificationSettings().then(result => {
      if (!active) return;
      setSaved(result.bookingEmails); setValue(result.bookingEmails.join('\n')); setConfigured(result.emailConfigured);
    }).catch(reason => { if (active) setError(message(reason)); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt]);

  const recipients = recipientList(value);
  const dirty = recipients.length !== saved.length || recipients.some(email => !saved.includes(email));

  return <main className="notifications-page">
    <h1>Уведомления</h1>
    <section aria-labelledby="booking-email-heading">
      <h2 id="booking-email-heading">Новые бронирования</h2>
      <p>Письмо отправляется на каждый указанный адрес, когда клиент сам бронирует игру через форму на сайте.</p>
      {loading ? <p role="status">Загружаем настройки…</p> : configured === null
        ? <button type="button" onClick={() => setAttempt(value => value + 1)}>Повторить загрузку</button>
        : <form onSubmit={async event => {
          event.preventDefault();
          if (saving || !dirty) return;
          setError(''); setNotice('');
          if (recipients.length > 25 || recipients.some(email => email.length > 254 || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email))) {
            setError('Укажите до 25 корректных адресов электронной почты.'); return;
          }
          setSaving(true);
          try {
            const result = await saveNotificationSettings(recipients);
            setSaved(result.bookingEmails); setValue(result.bookingEmails.join('\n')); setConfigured(result.emailConfigured);
            setNotice('Настройки сохранены.');
          } catch (reason) { setError(message(reason)); }
          finally { setSaving(false); }
        }}>
          {configured === false && <p className="notifications-page__hint">Почтовый сервис ещё не настроен на сервере. Адреса можно сохранить заранее.</p>}
          <label>Адреса получателей
            <textarea rows={4} value={value} disabled={saving} aria-describedby="notification-email-hint"
              onChange={event => { setValue(event.target.value); setError(''); setNotice(''); }} />
          </label>
          <p id="notification-email-hint" className="notifications-page__hint">По одному адресу на строку. Пустой список отключает рассылку.</p>
          <button type="submit" disabled={saving || !dirty}>{saving ? 'Сохраняем…' : 'Сохранить'}</button>
        </form>}
      {error && <p role="alert">{error}</p>}
      {notice && <p role="status">{notice}</p>}
    </section>
  </main>;
}
