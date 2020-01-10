const { createProvider } = require('sonorpc');
const MySQL = require('sonorpc-mysql');
const Redis = require('ioredis');

const config = require('./config');

// MySQL配置
const mysql = new MySQL(config.mysql);

// Redis配置
const redis = new Redis(config.redis);

const application = {
    mysql,
    redis
};

exports.start = function start() {
    return createProvider({
        name: 'market',
        port: 3007,
        registry: {
            port: 3006
        },
        extentions: {
            application
        },
        services: [
            require('./services/PageService'),
            require('./services/TemplateService')
        ]
    })
        .start();
};