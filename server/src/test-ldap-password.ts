
import { lldapGraphqlService } from './services/lldap-graphql.service';
import { ldapService } from './services/ldap.service';
import { config } from './config/env';

async function test() {
    const testUid = 'test_ldap_pwd_user_v2';
    const newPass = 'Password123!';

    try {
        console.log('1. Creating test user via GraphQL (no password)...');
        try {
            await lldapGraphqlService.createUser({
                uid: testUid,
                mail: 'testldap_v2@example.com',
                cn: 'Test LDAP User V2',
                // password: '...' // GraphQL doesn't support password
            });
            console.log('User created');
        } catch (e: any) {
            if (e.message.includes('already exists')) {
                console.log('User already exists, continuing...');
            } else {
                throw e;
            }
        }

        console.log('2. Finding user DN via LDAP...');
        const users = await ldapService.searchUsers(`(uid=${testUid})`);
        if (users.length === 0) throw new Error('User not found');
        const userDn = users[0].dn;
        console.log('User DN:', userDn);

        console.log('3. Setting password via LDAP...');
        await ldapService.changePassword(userDn, newPass);
        console.log('Password set successfully via LDAP');

        console.log('4. Verifying password by logging in...');
        const authUser = await ldapService.authenticate(testUid, newPass);
        if (authUser) {
            console.log('Authentication successful!');
        } else {
            console.error('Authentication failed!');
        }

        console.log('5. Deleting test user...');
        await lldapGraphqlService.deleteUser(testUid);
        console.log('User deleted');

    } catch (e: any) {
        console.error('Test failed:', e.message);
        if (e.response) {
            console.error('Response data:', JSON.stringify(e.response.data));
        }
    }
}

test();
