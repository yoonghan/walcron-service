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
          filterByFormula: `AND({Status}='${EnumOrderStatus.ORDER_PLACED}', {Business Partner Id} = '${partnerId}')`
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

  const _updateOrder = async (partnerId:string, orderId: string, status:EnumOrderStatus) => {
    base(EnumAirtables.ORDER).select({
        pageSize: 1,
        view: "Grid view",
        filterByFormula: `AND({Order Id}='${orderId}', {Business Partner Id} = '${partnerId}')`
    }).firstPage(function(err, records) {
      if(err || records.length !== 1) {
        console.error(err, 'retrieve update error');
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
      }
    });
  }

  const _findRepresentativeToken = async (representativeId:string) => (
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
          resolve(records[0].get('Pusher Token'));
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
    findPusherToken: _findRepresentativeToken,
    updateRepresentativeToken: _updateRepresentativeToken
  };
}
