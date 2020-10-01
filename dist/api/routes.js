'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const root_1 = __importDefault(require("./controller/root"));
const locker_1 = __importDefault(require("./controller/locker"));
module.exports = function (app) {
    app.map = function (a, route) {
        route = route || '';
        for (var key in a) {
            switch (typeof a[key]) {
                case 'object':
                    app.map(a[key], route + key);
                    break;
                case 'function':
                    app[key](route, a[key]);
                    break;
            }
        }
    };
    app.map({
        '/': {
            get: root_1.default.index
        },
        '/api': {
            '/locker/monitor': {
                get: locker_1.default.monitor,
                post: locker_1.default.invokeMonitor
            }
        }
    });
};
