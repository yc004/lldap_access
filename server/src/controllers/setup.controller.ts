import { Request, Response } from 'express';
import { dbService, SystemConfig } from '../services/db.service';
import { encrypt } from '../utils/crypto';
import ldap from 'ldapjs';
import axios from 'axios';
import crypto from 'crypto';

export class SetupController {
  
  public getStatus(req: Request, res: Response) {
    const isConfigured = dbService.isConfigured();
    res.json({ isConfigured });
  }

  public async setup(req: Request, res: Response) {
    try {
        const { 
            ldapUrl, 
            ldapBindDN, 
            ldapBindPassword, 
            ldapBaseDN, 
            ldapUserSearchBase, 
            ldapGroupSearchBase,
            lldapBaseUrl,
            lldapUsername,
            lldapPassword
        } = req.body;

        // Trim inputs where appropriate
        const trimmedLldapUsername = lldapUsername?.trim();
        const trimmedLldapBaseUrl = lldapBaseUrl?.replace(/\/$/, ''); // Remove trailing slash

        // Validation
        if (!ldapUrl || !ldapBindDN || !ldapBindPassword || !trimmedLldapBaseUrl || !trimmedLldapUsername || !lldapPassword) {
            return res.status(400).json({ message: 'Missing required fields' });
        }

        // Test LDAP Connection
        await new Promise<void>((resolve, reject) => {
            const client = ldap.createClient({ url: ldapUrl });
            
            // Set timeout for connection
            const timeout = setTimeout(() => {
                client.unbind();
                reject(new Error('LDAP Connection Timeout'));
            }, 5000);

            client.bind(ldapBindDN, ldapBindPassword, (err) => {
                clearTimeout(timeout);
                client.unbind();
                if (err) return reject(new Error('LDAP Connection Failed: ' + err.message));
                resolve();
            });
            
            client.on('error', (err) => {
                clearTimeout(timeout);
                // client.unbind(); // unbind might cause issues in error handler
                reject(new Error('LDAP Client Error: ' + err.message));
            });
        });

        // Test LLDAP Connection
        try {
             console.log(`[Setup] Attempting Simple Login to ${trimmedLldapBaseUrl}/auth/simple/login with user ${trimmedLldapUsername}`);
             await axios.post(`${trimmedLldapBaseUrl}/auth/simple/login`, {
                username: trimmedLldapUsername,
                password: lldapPassword
             }, { timeout: 5000 });
             console.log('[Setup] Simple Login Successful');
        } catch (e: any) {
             console.warn('[Setup] LLDAP Simple Login failed:', e.message);
             if (e.response) {
                 console.warn('[Setup] Simple Login Response Status:', e.response.status);
                 console.warn('[Setup] Simple Login Response Data:', JSON.stringify(e.response.data));
             }
             
             console.warn('[Setup] Trying GraphQL auth...');
             try {
                const mutation = `
                  mutation Login($username: String!, $password: String!) {
                    auth(username: $username, password: $password) {
                      token
                    }
                  }
                `;
                console.log(`[Setup] Attempting GraphQL Login to ${trimmedLldapBaseUrl}/api/graphql`);
                const gqlResponse = await axios.post(`${trimmedLldapBaseUrl}/api/graphql`, {
                    query: mutation,
                    variables: { username: trimmedLldapUsername, password: lldapPassword }
                }, { timeout: 5000 });
                
                console.log('[Setup] GraphQL Login Response:', JSON.stringify(gqlResponse.data));

                if (!gqlResponse.data?.data?.auth?.token) {
                     console.error('[Setup] LLDAP GraphQL Auth Response missing token:', JSON.stringify(gqlResponse.data));
                     throw new Error('LLDAP Login Failed: No token returned in response');
                }
             } catch (gqlErr: any) {
                 console.error('[Setup] LLDAP GraphQL Auth Error Object:', gqlErr);
                 if (gqlErr.response) {
                    console.error('[Setup] LLDAP GraphQL Response Data:', JSON.stringify(gqlErr.response.data));
                 }
                 
                 let msg = 'Unknown error';
                 
                 // Network errors
                 if (gqlErr.code === 'ECONNREFUSED') {
                     msg = `Unable to connect to LLDAP server at ${trimmedLldapBaseUrl}. Connection refused. Is the server running?`;
                 } else if (gqlErr.code === 'ENOTFOUND') {
                     msg = `Unable to resolve LLDAP server address: ${trimmedLldapBaseUrl}. Check the hostname.`;
                 } else if (gqlErr.code === 'ETIMEDOUT') {
                     msg = `Connection to LLDAP server at ${trimmedLldapBaseUrl} timed out.`;
                 } 
                 // HTTP Errors
                 else if (gqlErr.response?.status === 401) {
                     msg = 'Authentication failed. Please check your admin username and password.';
                 } else if (gqlErr.response?.status === 404) {
                     msg = `LLDAP Endpoint not found at ${trimmedLldapBaseUrl}. Check the Base URL.`;
                 }
                 // GraphQL Errors
                 else if (gqlErr.response?.data?.errors?.[0]?.message) {
                    msg = gqlErr.response.data.errors[0].message;
                 } else if (gqlErr.response?.data?.message) {
                    msg = gqlErr.response.data.message;
                 } 
                 // Fallback
                 else if (gqlErr.message) {
                    msg = gqlErr.message;
                 } else {
                    msg = JSON.stringify(gqlErr);
                 }
                 
                 return res.status(400).json({ message: 'LLDAP Connection Failed: ' + msg });
             }
        }

        // Generate JWT Secret
        const jwtSecret = crypto.randomBytes(64).toString('hex');

        // Save Config
        const config: SystemConfig = {
            ldapUrl,
            ldapBindDN,
            ldapBindPasswordEncrypted: encrypt(ldapBindPassword),
            ldapBaseDN,
            ldapUserSearchBase,
            ldapGroupSearchBase,
            lldapBaseUrl: trimmedLldapBaseUrl,
            lldapUsername: trimmedLldapUsername,
            lldapPasswordEncrypted: encrypt(lldapPassword),
            jwtSecretEncrypted: encrypt(jwtSecret),
            isConfigured: true
        };

        dbService.saveSystemConfig(config);

        res.json({ message: 'Configuration saved successfully' });

    } catch (error: any) {
        console.error('Setup failed:', error);
        res.status(500).json({ message: error.message });
    }
  }
}
