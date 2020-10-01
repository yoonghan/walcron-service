"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPusher = void 0;
const pusher_1 = __importDefault(require("pusher"));
function createPusher(appId, key, secret, cluster) {
    return new pusher_1.default({
        appId,
        key,
        secret,
        cluster
    });
}
exports.createPusher = createPusher;
