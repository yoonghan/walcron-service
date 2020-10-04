"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const cors_1 = __importDefault(require("cors"));
const general_1 = __importDefault(require("./controller/general"));
const root_1 = __importDefault(require("./controller/root"));
const locker_1 = __importDefault(require("./controller/locker"));
var corsOptions = {
    origin: process.env.ALLOWED_CROSS_ORIGIN,
    optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
};
module.exports = function (app) {
    app.map = function (a, route) {
        route = route || '';
        for (var key in a) {
            switch (typeof a[key]) {
                case 'object':
                    app.map(a[key], route + key);
                    break;
                case 'function':
                    app[key](route, cors_1.default(corsOptions), a[key]);
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
                get: locker_1.default.monitor
            },
            '/locker/trigger/:businesspartnerid/:partnerid': {
                post: locker_1.default.trigger,
                options: general_1.default.preflight
            },
            '/locker/order/:businesspartnerid/:partnerid': {
                get: locker_1.default.getAvailOrders,
                post: locker_1.default.placeOrder,
                options: general_1.default.preflight
            },
            '/locker/users/:userid/notification': {
                put: locker_1.default.updateUserNotification,
                options: general_1.default.preflight
            }
        }
    });
};
