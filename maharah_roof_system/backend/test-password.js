const bcrypt = require('bcryptjs');

// Test password hash
const password = '123456';
const hash = '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';

bcrypt.compare(password, hash).then(result => {
    console.log('Password match:', result);
    console.log('If true: hash is correct');
    console.log('If false: hash is wrong or password is wrong');
});

// Generate new hash for 123456
bcrypt.hash(password, 10).then(newHash => {
    console.log('\nNew hash for password "123456":');
    console.log(newHash);
    console.log('\nUse this SQL to update:');
    console.log(`UPDATE users SET password = '${newHash}' WHERE username = 'admin';`);
});
