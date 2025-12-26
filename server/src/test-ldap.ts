
import { ldapService } from './services/ldap.service';
import { config } from './config/env';

async function test() {
    try {
        console.log('Searching for admin...');
        const users = await ldapService.searchUsers('(uid=admin)');
        console.log('Result:', JSON.stringify(users, null, 2));
    } catch (e) {
        console.error(e);
    }
}

test();
