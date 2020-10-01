"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomGenPIN = void 0;
function randomGenPIN() {
    return Math.random().toString().substr(2, 4);
}
exports.randomGenPIN = randomGenPIN;
