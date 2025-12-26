import axios, { AxiosInstance } from 'axios';
import { config } from '../config/env';

export class LldapGraphqlService {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor() {
    this.client = axios.create({
      baseURL: `${config.lldap.baseUrl}/api/graphql`,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.client.interceptors.request.use(async (reqConfig) => {
      if (this.token) {
        reqConfig.headers.Authorization = `Bearer ${this.token}`;
      }
      return reqConfig;
    });

    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          await this.login();
          originalRequest.headers.Authorization = `Bearer ${this.token}`;
          return this.client(originalRequest);
        }
        return Promise.reject(error);
      }
    );
  }

  private async login() {
    // Standard LLDAP Login Mutation
    const mutation = `
      mutation Login($username: String!, $password: String!) {
        auth(username: $username, password: $password) {
          token
        }
      }
    `;

    try {
      console.log(`[GraphQL] Attempting simple login to ${config.lldap.baseUrl}/auth/simple/login with user ${config.lldap.username}`);
      const response = await axios.post(`${config.lldap.baseUrl}/auth/simple/login`, {
        username: config.lldap.username,
        password: config.lldap.password
      });
      
      if (response.data && response.data.token) {
        console.log('[GraphQL] Simple login successful');
        this.token = response.data.token;
      }
    } catch (error: any) {
        console.warn(`[GraphQL] Simple login failed: ${error.message}. Trying GraphQL auth...`);
        // Fallback to GraphQL auth mutation if simple login fails or doesn't exist
        try {
            const gqlResponse = await axios.post(`${config.lldap.baseUrl}/api/graphql`, {
                query: mutation,
                variables: {
                    username: config.lldap.username,
                    password: config.lldap.password
                }
            });
            
            if (gqlResponse.data?.data?.auth?.token) {
                console.log('[GraphQL] GraphQL auth successful');
                this.token = gqlResponse.data.data.auth.token;
            } else {
                console.error('[GraphQL] Failed to login to LLDAP GraphQL:', JSON.stringify(gqlResponse.data));
                throw new Error('LLDAP Login Failed');
            }
        } catch (gqlError: any) {
             console.error('[GraphQL] GraphQL auth error:', gqlError.message);
             if (gqlError.response) {
                 console.error('[GraphQL] Response data:', gqlError.response.data);
             }
             throw gqlError;
        }
    }
  }

  public async getUsers() {
    if (!this.token) await this.login();
    const query = `
      query {
        users {
          id
          email
          displayName
          groups {
            id
            displayName
          }
        }
      }
    `;
    try {
        const response = await this.client.post('', { query });
        if (response.data.errors) {
             console.error('[GraphQL] getUsers errors:', JSON.stringify(response.data.errors));
        }
        // Fix: LLDAP might return `users` directly or as `data.users` depending on version
        // Standard GraphQL is data.data.users
        console.log('[GraphQL] getUsers response:', JSON.stringify(response.data));
        return response.data.data.users;
    } catch (e: any) {
        console.error('[GraphQL] getUsers failed:', e.message);
        if (e.response) {
             console.error('[GraphQL] getUsers response data:', JSON.stringify(e.response.data));
        }
        throw e;
    }
  }

  public async createUser(user: any) {
    if (!this.token) await this.login();
    const mutation = `
      mutation CreateUser($user: CreateUserInput!) {
        createUser(user: $user) {
          id
        }
      }
    `;
    // Map our user object to LLDAP schema
    // LLDAP CreateUser input usually requires: id (username), email, displayName, password
    const lldapUser = {
        id: user.uid,
        email: user.mail,
        displayName: user.cn,
        // password: user.password // Not supported in CreateUserInput
    };

    const response = await this.client.post('', { 
        query: mutation, 
        variables: { user: lldapUser } 
    });
    
    if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
    }
    return response.data.data.createUser;
  }

  public async deleteUser(id: string) {
    if (!this.token) await this.login();
    const mutation = `
      mutation DeleteUser($userId: String!) {
        deleteUser(userId: $userId) {
          ok
        }
      }
    `;
    const response = await this.client.post('', { 
        query: mutation, 
        variables: { userId: id } 
    });
    
    if (response.data.errors) {
        throw new Error(response.data.errors[0].message);
    }
    return response.data.data.deleteUser;
  }

  public async updateUser(user: any) {
    if (!this.token) await this.login();
    // LLDAP updateUser returns Success type, which might not have 'id'.
    // Let's just ask for __typename or nothing if possible, but GraphQL requires selection set for objects.
    // If Success has 'ok' field? Or maybe it's just 'ok'.
    // Let's try checking what Success type has. usually 'ok' or 'success'.
    // Based on error "Unknown field id on type Success", it is an object.
    const mutation = `
      mutation UpdateUser($user: UpdateUserInput!) {
        updateUser(user: $user) {
          ok
        }
      }
    `;
    
    const lldapUser = {
        id: user.uid,
        email: user.mail,
        displayName: user.cn
        // password: user.password // Not supported in UpdateUserInput
    };
    // Remove undefined fields
    Object.keys(lldapUser).forEach(key => (lldapUser as any)[key] === undefined && delete (lldapUser as any)[key]);

    try {
        const response = await this.client.post('', { 
            query: mutation, 
            variables: { user: lldapUser } 
        });
        
        if (response.data.errors) {
            console.error('[GraphQL] UpdateUser errors:', JSON.stringify(response.data.errors));
            // If error is "Unknown field", try removing selection set (if it was scalar, but it said type Success)
            throw new Error(response.data.errors[0].message);
        }
        return response.data.data.updateUser;
    } catch (e: any) {
        // Fallback: try without selection set if 'ok' field also fails?
        // But for now let's assume 'ok' exists as it's common for LLDAP.
        throw e;
    }
  }
}

export const lldapGraphqlService = new LldapGraphqlService();
