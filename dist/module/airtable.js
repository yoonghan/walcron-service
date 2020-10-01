"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.connectAirtable = exports.EnumOrderStatus = exports.EnumAirtables = void 0;
const airtable_1 = __importDefault(require("airtable"));
const util_1 = require("./util");
var EnumAirtables;
(function (EnumAirtables) {
    EnumAirtables["ORDER"] = "Order";
    EnumAirtables["LOCK_LOG"] = "Lock Log";
})(EnumAirtables = exports.EnumAirtables || (exports.EnumAirtables = {}));
;
var EnumOrderStatus;
(function (EnumOrderStatus) {
    EnumOrderStatus["ORDER_PLACED"] = "Order Placed";
    EnumOrderStatus["READY"] = "Ready";
    EnumOrderStatus["TAKEN"] = "Taken";
    EnumOrderStatus["DELIVERED"] = "Delivered";
})(EnumOrderStatus = exports.EnumOrderStatus || (exports.EnumOrderStatus = {}));
;
function connectAirtable(apiKey, baseKey) {
    const base = new airtable_1.default({ apiKey: apiKey }).base(baseKey);
    const _buildLockLog = (orderId, businessPartnerId, lockerId, status, triggerDateTime) => ({
        "fields": {
            "Order Id": orderId,
            "Business Partner Id": [businessPartnerId],
            "Locker Id": lockerId,
            "Status": status,
            "Trigger DateTime": triggerDateTime
        }
    });
    const _buildOrder = (orderId, businessPartnerId, contactType, contactInfo, status) => ({
        "fields": {
            "Order Id": orderId,
            "Business Partner Id": [businessPartnerId],
            "Contact Type": contactType,
            "Contact Info": contactInfo,
            "Status": status
        }
    });
    const _getAllAvailableOrders = async (partnerId) => {
        return new Promise((resolve, reject) => {
            base(EnumAirtables.ORDER).select({
                maxRecords: 50,
                pageSize: 50,
                view: "Grid view",
                filterByFormula: `AND({Status}='${EnumOrderStatus.ORDER_PLACED}', {Business Partner Id} = '${partnerId}')`
            }).firstPage(function (err, records) {
                if (err) {
                    reject('no');
                }
                else {
                    const results = records.map(record => record.get('Order Id'));
                    resolve(results);
                }
            });
        });
    };
    const _updateOrder = async (partnerId, orderId, status) => {
        base(EnumAirtables.ORDER).select({
            pageSize: 1,
            view: "Grid view",
            filterByFormula: `AND({Order Id}='${orderId}', {Business Partner Id} = '${partnerId}')`
        }).firstPage(function (err, records) {
            if (err || records.length !== 1) {
                console.error(err, 'retrieve update error');
            }
            else {
                base(EnumAirtables.ORDER).update([
                    {
                        "id": records[0].id,
                        "fields": {
                            "Status": status,
                            "PIN": util_1.randomGenPIN()
                        }
                    }
                ], function (err, records) {
                    if (err) {
                        console.error(err, 'update error');
                    }
                });
            }
        });
    };
    const defaultCallback = (err, records) => {
        if (err) {
            console.error(err);
            return;
        }
    };
    const _create = (table, values, callback = defaultCallback) => {
        base(table).create(values, callback);
    };
    return {
        create: _create,
        buildLockLog: _buildLockLog,
        buildOrder: _buildOrder,
        getAvailableOrders: _getAllAvailableOrders,
        updateOrder: _updateOrder
    };
}
exports.connectAirtable = connectAirtable;
