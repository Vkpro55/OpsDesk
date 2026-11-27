import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';

// OWASP params; default maxmem too small.
// ponytail: params unstored; changing breaks existing hashes.
const PARAMS = { N: 2 ** 15, r: 8, p: 3, maxmem: 64 * 1024 * 1024 };

const derive = (password: string, salt: Buffer) =>
  new Promise<Buffer>((resolve, reject) =>
    scrypt(password, salt, 64, PARAMS, (err, key) =>
      err ? reject(err) : resolve(key),
    ),
  );

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  return `${salt.toString('hex')}:${(await derive(password, salt)).toString('hex')}`;
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [salt = '', hash = ''] = stored.split(':');
  const key = await derive(password, Buffer.from(salt, 'hex'));
  const expected = Buffer.from(hash, 'hex');
  return key.length === expected.length && timingSafeEqual(key, expected); // timingSafeEqual throws on length mismatch.
}
