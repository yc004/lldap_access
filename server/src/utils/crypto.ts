import crypto from 'crypto';
import path from 'path';
import fs from 'fs';

// Generate a random key if it doesn't exist, and store it in a separate key file
// In a real production environment, this should be an environment variable or KMS
const KEY_PATH = path.join(__dirname, '../../data/master.key');

function getMasterKey(): Buffer {
  if (fs.existsSync(KEY_PATH)) {
    return Buffer.from(fs.readFileSync(KEY_PATH, 'utf-8'), 'hex');
  }
  const key = crypto.randomBytes(32);
  const dir = path.dirname(KEY_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(KEY_PATH, key.toString('hex'));
  return key;
}

const ALGORITHM = 'aes-256-cbc';
const KEY = getMasterKey();

export function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, KEY, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

export function decrypt(text: string): string {
  const textParts = text.split(':');
  const iv = Buffer.from(textParts.shift()!, 'hex');
  const encryptedText = textParts.join(':');
  const decipher = crypto.createDecipheriv(ALGORITHM, KEY, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
