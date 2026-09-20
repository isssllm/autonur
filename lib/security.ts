import 'server-only';
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const SESSION_COOKIE = 'autonur_session';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-only-change-this-secret';
if (process.env.NODE_ENV === 'production' && (!process.env.SESSION_SECRET || process.env.SESSION_SECRET.length < 32 || process.env.SESSION_SECRET.includes('replace'))) throw new Error('SESSION_SECRET must be a long random value in production.');

type SessionPayload = { userId: string; issuedAt: number; nonce: string };

const b64 = (v: string | Buffer) => Buffer.from(v).toString('base64url');
const unb64 = (v: string) => Buffer.from(v, 'base64url').toString('utf8');

export { hashPassword, verifyPassword } from './password';

function sign(value: string) {
  return createHmac('sha256', SESSION_SECRET).update(value).digest('base64url');
}

export function createSessionValue(payload: SessionPayload) {
  const body = b64(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function readSessionValue(value?: string | null): SessionPayload | null {
  if (!value) return null;
  const [body, signature] = value.split('.');
  if (!body || !signature) return null;
  const expected = sign(body);
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(unb64(body)) as SessionPayload;
    if (!payload.userId || !payload.issuedAt || Date.now() - payload.issuedAt > 1000 * 60 * 60 * 24 * 30) return null;
    return payload;
  } catch {
    return null;
  }
}

export async function setSession(userId: string) {
  const store = await cookies();
  store.set(SESSION_COOKIE, createSessionValue({ userId, issuedAt: Date.now(), nonce: randomBytes(8).toString('hex') }), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const store = await cookies();
  store.set(SESSION_COOKIE, '', { httpOnly: true, sameSite: 'lax', secure: process.env.NODE_ENV === 'production', path: '/', maxAge: 0 });
}

export async function getSessionPayload() {
  const store = await cookies();
  return readSessionValue(store.get(SESSION_COOKIE)?.value);
}
