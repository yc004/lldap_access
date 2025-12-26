import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { ldapService } from '../services/ldap.service';
import { authService } from '../services/auth.service';
import { dbService } from '../services/db.service';
import { lldapGraphqlService } from '../services/lldap-graphql.service';
import ldap from 'ldapjs';

export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user.uid;
    const users = await ldapService.searchUsers(`(uid=${uid})`);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    
    const user = users[0];
    // Map LDAP attributes to frontend expected fields
    const profile = {
        ...user,
        displayName: user.displayName || user.cn, // Fallback to cn if displayName is missing
        mail: user.mail || ''
    };
    
    res.json(profile);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user.uid;
    const { mail, displayName } = req.body;
    
    // Find user DN first
    const users = await ldapService.searchUsers(`(uid=${uid})`);
    if (users.length === 0) return res.status(404).json({ message: 'User not found' });
    const user = users[0];

    const changes: ldap.Change[] = [];
    if (mail) {
      changes.push(new ldap.Change({
        operation: 'replace',
        modification: { mail }
      }));
    }
    // LLDAP uses 'cn' or 'displayName'? LLDAP usually maps 'cn' to name.
    if (displayName) {
      changes.push(new ldap.Change({
        operation: 'replace',
        modification: { cn: displayName } // Assuming cn is used for display name
      }));
    }

    if (changes.length > 0) {
      await ldapService.modifyUser(user.dn, changes);
      dbService.addLog(uid, 'UPDATE_PROFILE', 'User updated profile');
    }

    res.json({ message: 'Profile updated' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user.uid;
    const { currentPassword, newPassword } = req.body;

    // Verify current password by attempting to bind with LDAP (optional but recommended for security)
    // Or just trust the logged in session. 
    // Since we are moving to GraphQL for writes, let's use GraphQL to update the password.
    // BUT GraphQL UpdateUser doesn't check old password. It just sets new one.
    // So we should verify old password via LDAP or GraphQL auth first.
    
    // 1. Verify old password
    const user = await ldapService.authenticate(uid, currentPassword);
    if (!user) return res.status(400).json({ message: '当前密码错误' });

    // 2. Validate password strength
    if (newPassword.length < 8) return res.status(400).json({ message: '新密码长度至少需要8位' });

    // 3. Update password via LDAP Service (GraphQL doesn't support password update)
    await ldapService.changePassword(user.dn, newPassword);

    dbService.addLog(uid, 'CHANGE_PASSWORD', 'User changed password via LDAP');
    
    res.json({ message: '密码修改成功' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const setup2fa = async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user.uid;
    const result = await authService.setup2fa(uid);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const enable2fa = async (req: AuthRequest, res: Response) => {
  try {
    const uid = req.user.uid;
    const { secret, code } = req.body;
    await authService.enable2fa(uid, secret, code);
    res.json({ message: '2FA enabled' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
};

export const getLogs = async (req: AuthRequest, res: Response) => {
  const logs = dbService.getLogs(req.user.uid);
  res.json(logs);
};
