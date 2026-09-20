import { randomBytes, scryptSync, timingSafeEqual } from 'crypto';
export function hashPassword(password:string){const salt=randomBytes(16).toString('hex');const derived=scryptSync(password,salt,64).toString('hex');return `${salt}:${derived}`}
export function verifyPassword(password:string,encoded:string){const [salt,stored]=encoded.split(':');if(!salt||!stored)return false;const actual=scryptSync(password,salt,64);const expected=Buffer.from(stored,'hex');return expected.length===actual.length&&timingSafeEqual(actual,expected)}
