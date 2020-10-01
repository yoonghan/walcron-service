"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectAirtable = exports.EnumAirtables = void 0;
const airtable_1 = __importDefault(require("airtable"));
var EnumAirtables;
(function (EnumAirtables) {
    EnumAirtables["ORDER"] = "Order";
    EnumAirtables["LOCK_LOG"] = "Lock Log";
})(EnumAirtables = exports.EnumAirtables || (exports.EnumAirtables = {}));
;
function connectAirtable(apiKey, baseKey) {
    const base = new airtable_1.default({ apiKey: apiKey }).base(baseKey);
    const _create = (table, values) => {
        base(table).create(values, function (err, records) {
            if (err) {
                console.error(err);
                return;
            }
        });
    };
    return {
        create: _create
    };
}
exports.connectAirtable = connectAirtable;
