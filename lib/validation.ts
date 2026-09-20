export function normalizePhone(value: string) {
  const digits = value.replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('8')) return `+7${digits.slice(1)}`;
  if (digits.length === 11 && digits.startsWith('7')) return `+${digits}`;
  if (digits.length === 10) return `+7${digits}`;
  return '';
}

export function isValidPassword(password: string) {
  return password.length >= 8;
}

export function isHour(value: number) {
  return Number.isInteger(value) && value >= 0 && value <= 23;
}

export function dateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return null;
  const [year, month, day] = value.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  if (Number.isNaN(date.getTime())) return null;
  if (date.getUTCFullYear() !== year || date.getUTCMonth() !== month - 1 || date.getUTCDate() !== day) return null;
  return date;
}

export function dateKey(value: Date) {
  return value.toISOString().slice(0, 10);
}

export function formatDateRu(value: Date) {
  return new Intl.DateTimeFormat('ru-RU', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' }).format(value);
}

export function almatyNow() {
  return new Date(Date.now() + 5 * 60 * 60 * 1000);
}

export function almatyTodayKey() {
  return almatyNow().toISOString().slice(0, 10);
}

export function isHourInFutureForAlmaty(date: Date, startHour: number) {
  const today = almatyTodayKey();
  const key = dateKey(date);
  if (key !== today) return key > today;
  const now = almatyNow();
  return startHour > now.getUTCHours() || (startHour === now.getUTCHours() && now.getUTCMinutes() === 0);
}
