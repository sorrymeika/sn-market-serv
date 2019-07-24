const aesUtils = require('../src/utils/aesUtils');
const secret = aesUtils.encrypt('test', '1234567890123456');

console.log(secret);

const dec = aesUtils.decrypt(secret, '1234567890123456');

console.log(dec);
