const fs = require('fs');

if (!fs.existsSync('./node_modules/sonorpc')) {
    require('child_process').execSync('ln -s ../../sonorpc ./node_modules/sonorpc');
}

if (!fs.existsSync('./node_modules/sonorpc-mysql')) {
    require('child_process').execSync('ln -s ../../sonorpc ./node_modules/sonorpc');
}

require('../src/services')();
