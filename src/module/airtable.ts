import Airtable from 'airtable';
import {randomGenPIN} from './util';

export enum EnumAirtables {
  ORDER = "Order",
  LOCK_LOG = "Lock Log",
  REPRESENTATIVE = "Representative"
};

export enum EnumOrderStatus {
  ORDER_PLACED = "Order Placed",
  READY = "Ready",
  TAKEN = "Taken",
  DELIVERED = "Delivered"
};

type T_ORDER_CONTACT_TYPE = "Push Notification"|"Email"|"SMS"|"Representative";

export function connectAirtable (apiKey:string, baseKey:string) {
  const base = new Airtable({apiKey: apiKey}).base(baseKey);

  const _buildLockLog = (
    orderId: string,
    businessPartnerId: string,
    lockerId: string,
    status: string,
    triggerDateTime: string
  ) => (
    {
      "fields":{
        "Order Id": orderId,
        "Business Partner Id": [businessPartnerId],
        "Locker Id": lockerId,
        "Status": status,
        "Trigger DateTime": triggerDateTime
      }
    }
  );

  const _buildOrder = (
    orderId: string,
    businessPartnerId: string,
    contactType: T_ORDER_CONTACT_TYPE,
    contactInfo: string,
    status: EnumOrderStatus
  ) => (
    {
      "fields":{
        "Order Id": orderId,
        "Business Partner Id": [businessPartnerId],
        "Contact Type": contactType,
        "Contact Info": contactInfo,
        "Status": status
      }
    }
  );

  const _getAllAvailableOrders = async (partnerId:string) => {
    return new Promise((resolve, reject) => {
      base(EnumAirtables.ORDER).select({
          maxRecords: 50,
          pageSize: 50,
          view: "Grid view",
          filterByFormula: `AND(OR({Status}='${EnumOrderStatus.ORDER_PLACED}',{Status}='${EnumOrderStatus.READY}'), {Business Partner Id} = '${partnerId}')`
      }).firstPage(function(err, records) {
        if(err) {
          reject('no');
        }
        else {
          const results = records.map(record => record.get('Order Id'));
          resolve(results);
        }
      });
    });
  }

  const _updateOrder = async (partnerId:string, orderId: string, status:EnumOrderStatus) => (
    new Promise((resolve, reject) => {
      base(EnumAirtables.ORDER).select({
          pageSize: 1,
          view: "Grid view",
          filterByFormula: `AND({Order Id}='${orderId}', {Business Partner Id} = '${partnerId}')`
      }).firstPage(function(err, records) {
        if(err || records.length !== 1) {
          console.error(err, 'retrieve update error');
          reject('retrieve error');
        }
        else {
          base(EnumAirtables.ORDER).update([
            {
              "id": records[0].id,
              "fields": {
                "Status": status,
                "PIN": randomGenPIN()
              }
            }
          ], function(err, records) {
            if (err) {
              console.error(err, 'update error')
            }
          });

          resolve(
            {
            contactType: records[0].get('Contact Type'),
            contactInfo: records[0].get('Contact Info')
            }
          );
        }
      });
    })
  )

  const _findRepresentativeOrders = async (representativeId:string) => (
    new Promise((resolve, reject) => {
      base(EnumAirtables.ORDER).select({
        pageSize: 20,
        view: "Grid view",
        filterByFormula: `AND({Contact Type}='Representative', {Contact Info}=${representativeId})`
      }).firstPage(function(err, records) {
        if(err) {
          reject(err);
        }
        else {
          const results = records.map(record => ({
            orderId: record.get("Order Id"),
            status: record.get("Status"),
            createdDateTime: record.get("Created Date"),
            lastModifiedDateTime: record.get("Last Modified Date"),
            partnerId: record.get("Partner Id")
          }));
          resolve(results);
        }
      });
    })
  )

  const _findRepresentativeInfo = async (representativeId:string) => (
    new Promise((resolve, reject) => {
      base(EnumAirtables.REPRESENTATIVE).select({
          pageSize: 1,
          view: "Grid view",
          filterByFormula: `{Representative Id}='${representativeId}'`
      }).firstPage(function(err, records) {
        if(err || records.length !== 1) {
          console.error(err, "retrieve update error");
          reject("record not found");
        }
        else {
          resolve(
            {
              email: records[0].get('Email'),
              sms: records[0].get('SMS'),
              pushertoken: records[0].get('Pusher Token'),
              preference: records[0].get('Preference')
            }
          );
        }
      });
    })
  )

  const _updateRepresentativeToken = async (representativeId:string, token:string) => (
    new Promise((resolve, reject) => {
      base(EnumAirtables.REPRESENTATIVE).select({
          pageSize: 1,
          view: "Grid view",
          filterByFormula: `{Representative Id}='${representativeId}'`
      }).firstPage(function(err, records) {
        if(err || records.length !== 1) {
          console.error(err, "retrieve update error");
          reject("record not found");
        }
        else {
          base(EnumAirtables.REPRESENTATIVE).update([
            {
              "id": records[0].id,
              "fields": {
                "Pusher Token": token
              }
            }
          ], function(err, records) {
            if (err) {
              console.error(err, "update error");
              reject(`update error: ${err}`);
            }
            resolve("ok");
          });
        }
      });
    })
  )

  const defaultCallback = (err, records) => {
    if (err) {
      console.error(err);
      return;
    }
  }

  const _create = (table: string, values: Array<Object>, callback = defaultCallback) => {
    base(table).create(
      values,
      callback
    );
  }

  return {
    create: _create,
    buildLockLog: _buildLockLog,
    buildOrder: _buildOrder,
    getAvailableOrders: _getAllAvailableOrders,
    updateOrder: _updateOrder,
    findRepresentativeInfo: _findRepresentativeInfo,
    findRepresentativeOrders: _findRepresentativeOrders,
    updateRepresentativeToken: _updateRepresentativeToken
  };
}
