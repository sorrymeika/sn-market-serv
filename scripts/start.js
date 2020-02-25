const fs = require('fs');

const ln = (moduleName) => {
    if (!fs.existsSync('./node_modules/' + moduleName)) {
        require('child_process').execSync('ln -s ../../' + moduleName + ' ./node_modules/' + moduleName);
    }
};

ln('sonorpc');

require('sonorpc').startProvider();
