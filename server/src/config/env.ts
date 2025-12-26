import dotenv from 'dotenv';
import { dbService } from '../services/db.service';
import { decrypt } from '../utils/crypto';

dotenv.config();

export const config = {
  port: process.env.PORT || 3000,
  get ldap() {
    const sysConfig = dbService.getSystemConfig();
    if (!sysConfig) {
      return {
        url: '',
        bindDN: '',
        bindPassword: '',
        baseDN: '',
        userSearchBase: '',
        groupSearchBase: ''
      };
    }
    return {
      url: sysConfig.ldapUrl,
      bindDN: sysConfig.ldapBindDN,
      bindPassword: decrypt(sysConfig.ldapBindPasswordEncrypted),
      baseDN: sysConfig.ldapBaseDN,
      userSearchBase: sysConfig.ldapUserSearchBase,
      groupSearchBase: sysConfig.ldapGroupSearchBase,
    };
  },
  get lldap() {
    const sysConfig = dbService.getSystemConfig();
    if (!sysConfig) {
      return {
        baseUrl: '',
        username: '',
        password: ''
      };
    }
    return {
      baseUrl: sysConfig.lldapBaseUrl,
      username: sysConfig.lldapUsername,
      password: decrypt(sysConfig.lldapPasswordEncrypted),
    };
  },
  get jwt() {
    const sysConfig = dbService.getSystemConfig();
    if (!sysConfig) {
      return {
        secret: 'temporary-secret-until-configured',
        expiresIn: '1d'
      };
    }
    return {
      secret: decrypt(sysConfig.jwtSecretEncrypted),
      expiresIn: '1d',
    };
  }
};
