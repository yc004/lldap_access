import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(__dirname, '../../data/db.json');

interface UserData {
  uid: string;
  twoFactorSecret?: string;
  twoFactorEnabled: boolean;
  passwordHistory: string[]; // Hash of last passwords
}

interface AuditLog {
  id: string;
  timestamp: string;
  uid: string; // Actor
  action: string;
  details: string;
}

export interface SystemConfig {
  ldapUrl: string;
  ldapBindDN: string;
  ldapBindPasswordEncrypted: string; // Encrypted
  ldapBaseDN: string;
  ldapUserSearchBase: string;
  ldapGroupSearchBase: string;
  lldapBaseUrl: string;
  lldapUsername: string;
  lldapPasswordEncrypted: string; // Encrypted
  jwtSecretEncrypted: string; // Encrypted
  isConfigured: boolean;
}

interface DbSchema {
  users: Record<string, UserData>;
  logs: AuditLog[];
  config?: SystemConfig;
}

export class DbService {
  private data: DbSchema;

  constructor() {
    this.ensureDb();
    this.data = this.readDb();
  }

  private ensureDb() {
    const dir = path.dirname(DB_PATH);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (!fs.existsSync(DB_PATH)) {
      fs.writeFileSync(DB_PATH, JSON.stringify({ users: {}, logs: [] }, null, 2));
    }
  }

  private readDb(): DbSchema {
    try {
        const content = fs.readFileSync(DB_PATH, 'utf-8');
        return JSON.parse(content);
    } catch (e) {
        console.error('Failed to read DB, returning empty schema:', e);
        return { users: {}, logs: [] };
    }
  }

  private saveDb() {
    fs.writeFileSync(DB_PATH, JSON.stringify(this.data, null, 2));
  }

  public getUserData(uid: string): UserData {
    if (!this.data.users) {
        this.data.users = {};
    }
    if (!this.data.users[uid]) {
      this.data.users[uid] = {
        uid,
        twoFactorEnabled: false,
        passwordHistory: []
      };
      this.saveDb();
    }
    return this.data.users[uid];
  }

  public updateUser(uid: string, data: Partial<UserData>) {
    const user = this.getUserData(uid);
    this.data.users[uid] = { ...user, ...data };
    this.saveDb();
  }

  public addLog(uid: string, action: string, details: string) {
    if (!this.data.logs) {
        this.data.logs = [];
    }
    this.data.logs.push({
      id: Date.now().toString(),
      timestamp: new Date().toISOString(),
      uid,
      action,
      details
    });
    this.saveDb();
  }

  public getLogs(uid?: string) {
    if (!this.data.logs) return [];
    if (uid) {
      return this.data.logs.filter(log => log.uid === uid);
    }
    return this.data.logs;
  }

  public getSystemConfig(): SystemConfig | null {
    return this.data.config || null;
  }

  public saveSystemConfig(config: SystemConfig) {
    this.data.config = config;
    this.saveDb();
  }
  
  public isConfigured(): boolean {
    return !!(this.data.config && this.data.config.isConfigured);
  }
}

export const dbService = new DbService();
