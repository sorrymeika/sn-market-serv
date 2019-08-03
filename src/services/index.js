const { createProvider } = require('sonorpc');
const MySQL = require('sonorpc-mysql');
const Redis = require('ioredis');

const config = require('../config');

// MySQL配置
const mysql = new MySQL(config.mysql);

// Redis配置
const redis = new Redis(config.redis);

const ctx = {
    mysql,
    redis
};

module.exports = function start() {
    return createProvider({
        name: 'market',
        ctx,
        port: 3007,
        registry: {
            port: 3006
        },
        serviceClasses: [
            require('./PageService'),
            require('./TemplateService')
        ]
    })
        .start();
};