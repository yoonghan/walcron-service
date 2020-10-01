"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
//This is a project for lockers
const kafka_1 = require("../../module/kafka");
const airtable_1 = require("../../module/airtable");
const { KAFKA_BROKERS, KAFKA_USERNAME, KAFKA_PASSWORD, KAFKA_TOPIC_PREFIX, KAFKA_GROUP_ID } = process.env;
const kafkaConf = kafka_1.createKafkaConf(KAFKA_BROKERS.split(','), KAFKA_USERNAME, KAFKA_PASSWORD);
let kafkaWriter = undefined;
const locker = {
    monitor: async function (req, res) {
        res.json({ 'status': 'initiated reader' });
    },
    trigger: async function (req, res) {
        const partnerId = req.params.partnerid;
        const businessPartnerId = req.params.businesspartnerid;
        const _createMessage = (message) => {
            message.partnerId = partnerId;
            message.businessPartnerId = businessPartnerId;
            message.triggerTime = new Date().toISOString();
            return JSON.stringify(message);
        };
        if (typeof kafkaWriter === 'undefined') {
            console.log('created kafka writer');
            kafkaWriter = await kafka_1.runKafkaProducer(kafkaConf, KAFKA_TOPIC_PREFIX);
        }
        kafkaWriter(_createMessage(req.body));
        res.json({ 'status': 'initiated writer' });
    },
    placeOrder: async function (req, res) {
        const orderId = req.body.order_id;
        const contactType = req.body.contact_type;
        const contactInfo = req.body.contact_info;
        const businessPartnerId = req.params.businesspartnerid;
        const { AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE } = process.env;
        const airtable = airtable_1.connectAirtable(AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE);
        airtable.create(airtable_1.EnumAirtables.ORDER, [
            airtable.buildOrder(orderId, businessPartnerId, contactType, contactInfo, airtable_1.EnumOrderStatus.ORDER_PLACED)
        ], function (err, records) {
            if (err) {
                res.status(400).json({ 'status': err.message });
            }
            res.json({ 'status': 'ok' });
        });
    },
    getAvailOrders: async function (req, res) {
        const partnerId = req.params.partnerid;
        const { AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE } = process.env;
        const airtable = airtable_1.connectAirtable(AIRTABLE_API_KEY_TWICE, AIRTABLE_BASE_KEY_TWICE);
        try {
            const orders = await airtable.getAvailableOrders(partnerId);
            res.json({ 'status': 'ok', 'orders': orders });
        }
        catch (err) {
            res.status(404).json({ 'status': 'no records' });
        }
    }
};
exports.default = locker;
