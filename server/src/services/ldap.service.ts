import ldap from 'ldapjs';
import { config } from '../config/env';

export interface LdapUser {
  dn: string;
  cn: string;
  mail: string;
  uid: string;
  [key: string]: any;
}

export class LdapService {
  
  private createClient(): ldap.Client {
    return ldap.createClient({
      url: config.ldap.url,
      reconnect: true
    });
  }

  public async authenticate(uid: string, password: string): Promise<any | null> {
    return new Promise((resolve) => {
      const client = ldap.createClient({ url: config.ldap.url });
      
      // Bind as admin first to find the user DN
      client.bind(config.ldap.bindDN, config.ldap.bindPassword, (err) => {
        if (err) {
            console.error('LDAP Admin bind failed', err);
            client.unbind();
            return resolve(null);
        }

        // Search for the user
        const opts: ldap.SearchOptions = {
          filter: `(uid=${uid})`,
          scope: 'sub',
          attributes: ['dn', 'uid', 'cn', 'mail', 'memberOf', 'displayName']
        };

        client.search(config.ldap.userSearchBase, opts, (err, res) => {
          if (err) {
              console.error('LDAP Search failed', err);
              client.unbind();
              return resolve(null);
          }

          let user: any = null;

          res.on('searchEntry', (entry: any) => {
             if (entry.object) {
                 user = entry.object;
             } else {
                 const attributes = entry.attributes || (entry.pojo && entry.pojo.attributes);
                 if (attributes && Array.isArray(attributes)) {
                     const obj: any = { dn: (entry.objectName || entry.dn).toString() };
                     attributes.forEach((attr: any) => {
                         const values = attr.values || attr.vals;
                         if (values && values.length > 0) {
                             obj[attr.type] = values.length === 1 ? values[0] : values;
                         }
                     });
                     user = obj;
                 }
             }
          });

          res.on('end', () => {
            if (!user) {
                client.unbind();
                return resolve(null);
            }

            // Attempt to bind as the user to verify password
            const userClient = ldap.createClient({ url: config.ldap.url });
            userClient.bind(user.dn, password, (err) => {
              client.unbind();
              userClient.unbind();
              if (err) {
                  // console.warn('User bind failed', err); // Invalid password
                  return resolve(null);
              }
              resolve(user);
            });
          });
          
          res.on('error', (err) => {
              console.error('LDAP Search result error', err);
              client.unbind();
              resolve(null);
          });
        });
      });
    });
  }

  /**
   * Execute an operation as Admin
   */
  private async withAdminClient<T>(operation: (client: ldap.Client) => Promise<T>): Promise<T> {
    const client = this.createClient();
    
    return new Promise((resolve, reject) => {
      client.bind(config.ldap.bindDN, config.ldap.bindPassword, async (err) => {
        if (err) {
          client.unbind();
          return reject(err);
        }

        try {
          const result = await operation(client);
          resolve(result);
        } catch (opErr) {
          reject(opErr);
        } finally {
          client.unbind();
        }
      });
    });
  }

  /**
   * Search users with filter
   */
  public async searchUsers(filter: string = '(objectClass=person)'): Promise<LdapUser[]> {
    return this.withAdminClient((client) => {
      return new Promise((resolve, reject) => {
        const opts: ldap.SearchOptions = {
          filter: filter,
          scope: 'sub',
          attributes: ['dn', 'cn', 'mail', 'uid', 'memberOf']
        };

        const users: LdapUser[] = [];

        client.search(config.ldap.userSearchBase, opts, (err, res) => {
          if (err) return reject(err);

          res.on('searchEntry', (entry: any) => {
                if (entry.object) {
                    users.push(entry.object as unknown as LdapUser);
                } else {
                    // entry.object is missing, try to parse from attributes
                    // entry might be the Entry object itself or a POJO
                    const attributes = entry.attributes || (entry.pojo && entry.pojo.attributes);
                    
                    if (attributes && Array.isArray(attributes)) {
                        const obj: any = { dn: (entry.objectName || entry.dn).toString() };
                        attributes.forEach((attr: any) => {
                            const values = attr.values || attr.vals;
                            if (values && values.length > 0) {
                                obj[attr.type] = values.length === 1 ? values[0] : values;
                            }
                        });
                        users.push(obj);
                    } else {
                        console.warn('Fallback to entry (no attributes found)', entry);
                        users.push(entry as unknown as LdapUser);
                    }
                }
            });

          res.on('error', (err) => reject(err));
          
          res.on('end', () => resolve(users));
        });
      });
    });
  }

  /**
   * Modify user attributes
   */
  public async modifyUser(dn: string, operation: ldap.Change | ldap.Change[]): Promise<void> {
    return this.withAdminClient((client) => {
      return new Promise((resolve, reject) => {
        client.modify(dn, operation, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }

  /**
   * Change password
   */
  public async changePassword(dn: string, newPass: string): Promise<void> {
    const change = new ldap.Change({
      operation: 'replace',
      modification: {
        type: 'userPassword',
        values: [newPass]
      }
    });
    return this.modifyUser(dn, change);
  }

  /**
   * Add new user
   */
  public async addUser(dn: string, entry: any): Promise<void> {
    return this.withAdminClient((client) => {
      return new Promise((resolve, reject) => {
        client.add(dn, entry, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }

  /**
   * Delete user
   */
  public async deleteUser(dn: string): Promise<void> {
    return this.withAdminClient((client) => {
      return new Promise((resolve, reject) => {
        client.del(dn, (err) => {
          if (err) return reject(err);
          resolve();
        });
      });
    });
  }
}

export const ldapService = new LdapService();
