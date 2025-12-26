
import { lldapGraphqlService } from './services/lldap-graphql.service';
import { config } from './config/env';

async function test() {
    const testUid = 'test_pwd_user';
    const initialPass = 'Password123!';
    const newPass = 'Password456!';

    try {
        console.log('1. Creating test user...');
        try {
            await lldapGraphqlService.createUser({
                uid: testUid,
                mail: 'test@example.com',
                cn: 'Test User',
                password: initialPass
            });
            console.log('User created');
        } catch (e: any) {
            if (e.message.includes('already exists')) {
                console.log('User already exists, continuing...');
            } else {
                throw e;
            }
        }

        console.log('2. Updating password...');
        const result = await lldapGraphqlService.updateUser({
            uid: testUid,
            password: newPass
        });
        console.log('Update result:', JSON.stringify(result));

        console.log('3. Deleting test user...');
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
