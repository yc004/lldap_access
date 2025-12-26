import jwt from 'jsonwebtoken';
import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import { config } from '../config/env';
import { ldapService } from './ldap.service';
import { dbService } from './db.service';

export class AuthService {
  
  private generateToken(user: any) {
    // Check if admin
    const groups = Array.isArray(user.memberOf) ? user.memberOf : [user.memberOf];
    const isAdmin = groups.some((g: string) => g && g.includes('cn=admin')) || user.uid === 'admin';

    return jwt.sign(
      { 
        uid: user.uid, 
        cn: user.cn, 
        mail: user.mail,
        isAdmin 
      }, 
      config.jwt.secret, 
      { expiresIn: config.jwt.expiresIn as any }
    );
  }

  async login(username: string, password: string) {
    const user = await ldapService.authenticate(username, password);
    if (!user) throw new Error('Invalid credentials');

    const userData = dbService.getUserData(username);
    
    if (userData.twoFactorEnabled) {
      const tempToken = jwt.sign({ uid: username, temp: true }, config.jwt.secret, { expiresIn: '5m' });
      return { require2fa: true, tempToken };
    }

    const token = this.generateToken(user);
    dbService.addLog(username, 'LOGIN', 'User logged in');
    return { token, user: { ...user, isAdmin: this.isAdmin(user) } };
  }

  async verify2faLogin(tempToken: string, code: string) {
    try {
      const decoded = jwt.verify(tempToken, config.jwt.secret) as any;
      if (!decoded.temp) throw new Error('Invalid token type');

      const userData = dbService.getUserData(decoded.uid);
      if (!userData.twoFactorEnabled || !userData.twoFactorSecret) {
         throw new Error('2FA not enabled');
      }

      const isValid = authenticator.check(code, userData.twoFactorSecret);
      if (!isValid) throw new Error('Invalid 2FA code');

      // Fetch user again to generate full token (or just use stored info if we had it, but better to fetch)
      // We need to fetch user details to put in token. But we don't have password.
      // However, we trusted the temp token which was issued after password check.
      // We can search user as admin.
      const users = await ldapService.searchUsers(`(uid=${decoded.uid})`);
      const user = users[0];
      if (!user) throw new Error('User not found');

      const token = this.generateToken(user);
      dbService.addLog(decoded.uid, 'LOGIN_2FA', 'User logged in with 2FA');
      return { token, user: { ...user, isAdmin: this.isAdmin(user) } };

    } catch (err) {
      throw new Error('Invalid or expired 2FA session');
    }
  }

  async setup2fa(uid: string) {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(uid, 'LLDAP Manager', secret);
    const qrCode = await QRCode.toDataURL(otpauth);
    
    return { secret, qrCode };
  }

  async enable2fa(uid: string, secret: string, code: string) {
    const isValid = authenticator.check(code, secret);
    if (!isValid) throw new Error('Invalid code');

    dbService.updateUser(uid, { twoFactorEnabled: true, twoFactorSecret: secret });
    dbService.addLog(uid, 'ENABLE_2FA', '2FA enabled');
    return true;
  }

  private isAdmin(user: any): boolean {
    const groups = Array.isArray(user.memberOf) ? user.memberOf : [user.memberOf];
    return groups.some((g: string) => g && g.includes('cn=admin')) || user.uid === 'admin';
  }
}

export const authService = new AuthService();
