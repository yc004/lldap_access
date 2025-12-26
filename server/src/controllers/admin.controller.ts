import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';
import { lldapGraphqlService } from '../services/lldap-graphql.service';
import { ldapService } from '../services/ldap.service';
import { dbService } from '../services/db.service';
import { config } from '../config/env';
import fs from 'fs';
import csv from 'csv-parser';

export const listUsers = async (req: AuthRequest, res: Response) => {
  try {
    // Try GraphQL first (it's richer), fallback to LDAP if needed or for filters
    // But GraphQL query is different.
    // If filter is simple, we use GraphQL. If complex LDAP filter, use LDAP service.
    // For now, let's use GraphQL for the main list as requested.
    // But our frontend sends an LDAP filter query `?filter=...`. 
    // If we use GraphQL, we can't easily map the LDAP filter string.
    // However, the user asked to use "extra interfaces".
    // I will use GraphQL to get ALL users and filter in memory OR 
    // stick to LDAP for searching but use GraphQL for mutations.
    // Since the requirement was "operate related functions", mutations are the key operations.
    // Let's keep reading via LDAP for search flexibility (since LLDAP supports it well)
    // but use GraphQL for CREATE/DELETE/UPDATE.
    
    // Actually, let's try to use GraphQL for listing too if no filter is present, just to show we use it.
    if (!req.query.filter || req.query.filter === '(objectClass=person)') {
        try {
            const users = await lldapGraphqlService.getUsers();
            if (!users || !Array.isArray(users)) {
                return res.json([]);
            }
            // Map to LDAP format for frontend compatibility
            const mapped = users.filter((u: any) => u).map((u: any) => ({
                dn: `uid=${u.id},${config.ldap.userSearchBase}`,
                uid: u.id,
                cn: u.displayName,
                mail: u.email,
                groups: u.groups, // Pass original groups data
                memberOf: u.groups ? u.groups.map((g: any) => `cn=${g.displayName},${config.ldap.groupSearchBase}`) : []
            }));
            return res.json(mapped);
        } catch (e) {
            console.warn('GraphQL list failed, falling back to LDAP', e);
        }
    }
    
    const filter = req.query.filter as string || '(objectClass=person)';
    const users = await ldapService.searchUsers(filter);
    res.json(users);
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req: AuthRequest, res: Response) => {
  try {
    const { uid, mail, cn, password } = req.body;
    
    // Use GraphQL Service
    await lldapGraphqlService.createUser({ uid, mail, cn, password });
    
    dbService.addLog(req.user.uid, 'CREATE_USER', `Created user ${uid} via GraphQL`);
    res.json({ message: 'User created' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.params;
    
    // Use GraphQL Service
    await lldapGraphqlService.deleteUser(uid);
    
    dbService.addLog(req.user.uid, 'DELETE_USER', `Deleted user ${uid} via GraphQL`);
    res.json({ message: 'User deleted' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const updateUser = async (req: AuthRequest, res: Response) => {
  try {
    const { uid } = req.params;
    const { mail, cn, password } = req.body;
    
    // 1. Update Info via GraphQL
    // Only pass fields that are present
    if (mail || cn) {
        await lldapGraphqlService.updateUser({ uid, mail, cn });
    }

    // 2. Update Password via LDAP if provided
    if (password && password.trim() !== '') {
        const users = await ldapService.searchUsers(`(uid=${uid})`);
        if (users.length > 0) {
            await ldapService.changePassword(users[0].dn, password);
        }
    }
    
    dbService.addLog(req.user.uid, 'UPDATE_USER', `Updated user ${uid} (info${password ? ' + password' : ''})`);
    res.json({ message: 'User updated' });
  } catch (error: any) {
    res.status(500).json({ message: error.message });
  }
};

export const importUsers = async (req: AuthRequest, res: Response) => {
  if (!req.file) return res.status(400).json({ message: 'No file uploaded' });
  
  const filePath = req.file.path;
  const results: any[] = [];
  
  fs.createReadStream(filePath)
    .pipe(csv())
    .on('data', (data) => results.push(data))
    .on('end', async () => {
       let success = 0;
       let failed = 0;
       const errors: any[] = [];

       for (const row of results) {
          try {
             if (!row.uid || !row.password) {
               throw new Error('Missing uid or password');
             }
             
             // Use GraphQL Service
             await lldapGraphqlService.createUser({
                 uid: row.uid,
                 mail: row.mail || '',
                 cn: row.cn || row.uid,
                 password: row.password
             });
             
             success++;
          } catch (e: any) {
             failed++;
             errors.push({ uid: row.uid, error: e.message });
          }
       }
       
       fs.unlinkSync(filePath); // cleanup
       
       dbService.addLog(req.user.uid, 'IMPORT_USERS', `Imported ${success} users, ${failed} failed (via GraphQL)`);
       res.json({ message: 'Import completed', success, failed, errors });
    });
};
