'use strict';
const root = require('./controller/root');
const locker = require('./controller/locker');
module.exports = function (app) {
    app.map({
        '/api': {
            '/locker/monitor': {
                get: locker.monitor,
                post: locker.invokeMonitor
            }
        },
        '/': {
            get: root.index
        }
    });
};
