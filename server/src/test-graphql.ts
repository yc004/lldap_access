
import { lldapGraphqlService } from './services/lldap-graphql.service';
import { config } from './config/env';

async function test() {
    try {
        console.log('Testing updateUser password change...');
        // Assume user 'testuser' exists or use 'admin' if safe (better not change admin password blindly)
        // Let's create a temp user first? No, too complex.
        // Let's just try to update 'admin' email slightly (and revert) to see if mutation works structure-wise.
        // Or better, catch the error.
        
        // We will try to update a non-existent user to see schema validation errors? 
        // No, that might give "User not found".
        
        // Let's try to update 'admin' with just ID to see if it complains about missing fields.
        await lldapGraphqlService.updateUser({
            uid: 'admin',
            // No other fields
        });
        console.log('Update success (no-op)');

    } catch (e: any) {
        console.error('Update failed:', e.message);
        if (e.response) {
            console.error('Response:', JSON.stringify(e.response.data));
        }
    }
}

test();
