
import { lldapGraphqlService } from './services/lldap-graphql.service';
import axios from 'axios';
import { config } from './config/env';

async function introspect() {
    try {
        // Login manually or use service (service login is private, let's use service client if exposed or just axios)
        // Accessing private client is hard. Let's just use axios directly.
        
        // 1. Login via Simple Auth (more reliable based on previous logs)
        console.log(`Logging in to ${config.lldap.baseUrl}/auth/simple/login...`);
        const loginRes = await axios.post(`${config.lldap.baseUrl}/auth/simple/login`, {
            username: config.lldap.username,
            password: config.lldap.password
        });
        
        const token = loginRes.data.token;
        console.log('Token obtained');

        // 3. Introspection Mutations
        const introspectionQuery = `
          query {
            __type(name: "Mutation") {
              name
              fields {
                name
                args {
                  name
                  type {
                    name
                    kind
                  }
                }
              }
            }
          }
        `;

        const res = await axios.post(`${config.lldap.baseUrl}/api/graphql`, {
            query: introspectionQuery
        }, {
            headers: { Authorization: `Bearer ${token}` }
        });
        
        console.log('Mutations:', JSON.stringify(res.data.data.__type.fields, null, 2));

    } catch (e: any) {
        console.error('Error:', e.message);
        if (e.response) console.error(JSON.stringify(e.response.data));
    }
}

introspect();
