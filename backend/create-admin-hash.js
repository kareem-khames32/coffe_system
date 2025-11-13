const bcrypt = require('bcryptjs');

async function createAdminPassword() {
    const password = 'admin123';
    const hashedPassword = await bcrypt.hash(password, 10);
    console.log('\n===========================================');
    console.log('Password Hash for "admin123":');
    console.log('===========================================');
    console.log(hashedPassword);
    console.log('===========================================\n');
    console.log('Copy this hash and use it in MySQL:\n');
    console.log(`UPDATE users SET password = '${hashedPassword}' WHERE username = 'admin';\n`);
}

createAdminPassword();
