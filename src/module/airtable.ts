import Airtable from 'airtable';
import {randomGenPIN} from './util';
import {T_ORDER_CONTACT_TYPE} from '../definition/type';
import {EnumOrderStatus, EnumLockStatus} from '../definition/enum';

export enum EnumAirtables {
  ORDER = "Order",
  ORDER_LOG = "Order Log",
  LOCK = "Lock",
  LOCK_LOG = "Lock Log",
  REPRESENTATIVE = "Representative",
  SMARTHOME_ACTION_LOG = "Action Log",
  SMARTHOME_STATUS = "Status"
};

export function connectAirtable (apiKey:string, twiceBaseKey:string, smarthomeBaseKey:string) {
  const twiceBase = new Airtable({apiKey: apiKey}).base(twiceBaseKey);
  const smarthomeBase = new Airtable({apiKey: apiKey}).base(smarthomeBaseKey);

  const _buildLock = (
    businessPartnerId: string,
    lockerId: string,
    status: string
  ) => (
    {
      "fields":{
        "Locker Id": lockerId,
        "Business Partner Id": [businessPartnerId],
        "Order Id": "",
        "PIN": "",
        "Status": status
      }
    }
  )

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

  const _buildOrderLog = (
    orderId: string,
    businessPartnerId: string,
    status: EnumOrderStatus,
    triggerDateTime: string
  ) => (
    {
      "fields":{
        "Order Id": orderId,
        "Business Partner Id": [businessPartnerId],
        "Status": status,
        "Trigger DateTime": triggerDateTime
      }
    }
  );

  const _getAllCurrentLockStatus = async (partnerId:string) => {
    return new Promise((resolve, reject) => {
      twiceBase(EnumAirtables.LOCK).select({
          maxRecords: 20,
          pageSize: 20,
          view: "Grid view",
          filterByFormula: `{Business Partner Id} = '${partnerId}'`
      }).firstPage(function(err, records) {
        if(err) {
          reject('no');
        }
        else {
          const results = records.map(record => (
            {
              lockerId: record.get('Locker Id'),
              orderId: record.get('Order Id'),
              status: record.get('Status'),
              pin: record.get('PIN')
            }
          ));
          resolve(results);
        }
      });
    });
  }

  const _getAllAvailableOrders = async (partnerId:string) => {
    return new Promise((resolve, reject) => {
      twiceBase(EnumAirtables.ORDER).select({
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
      twiceBase(EnumAirtables.ORDER).select({
          pageSize: 1,
          view: "Grid view",
          filterByFormula: `AND({Order Id}='${orderId}', {Business Partner Id} = '${partnerId}')`
      }).firstPage(function(err, records) {
        if(err || records.length !== 1) {
          console.error(err, 'retrieve update error');
          reject('retrieve error');
        }
        else {
          twiceBase(EnumAirtables.ORDER).update([
            {
              "id": records[0].id,
              "fields": {
                "Status": status
              }
            }
            ], function(err, records) {
              if (err) {
                console.error(err, 'update error')
              }
            });

          resolve(
            {
              "contactType": records[0].get('Contact Type'),
              "contactInfo": records[0].get('Contact Info')
            }
          );
        }
      });
    })
  )

  const _updateLock = async (lockerId: string, partnerId:string, orderId:string, status:EnumLockStatus) => (
    new Promise((resolve, reject) => {
      twiceBase(EnumAirtables.LOCK).select({
          pageSize: 1,
          view: "Grid view",
          filterByFormula: `AND({Locker Id}='${lockerId}', {Business Partner Id} = '${partnerId}')`
      }).firstPage(function(err, records) {
        if(err || records.length !== 1) {
          console.error(err, 'retrieve update error');
          reject('retrieve error');
        }
        else {
          twiceBase(EnumAirtables.LOCK).update([
            {
              "id": records[0].id,
              "fields": {
                "Order Id": orderId,
                "Status": status,
                "PIN": randomGenPIN()
              }
            }
            ], function(err, records) {
              if (err) {
                console.error(err, 'update error')
              }
              resolve({})
            });
        }
      });
    })
  )

  const _findRepresentativeOrders = async (representativeId:string) => (
    new Promise((resolve, reject) => {
      twiceBase(EnumAirtables.ORDER).select({
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

  const _findRepresentativeInfo = (representativeId:string) => (
    new Promise((resolve, reject) => {
      twiceBase(EnumAirtables.REPRESENTATIVE).select({
          pageSize: 1,
          view: "Grid view",
          filterByFormula: `{Representative Id}='${representativeId}'`
      }).firstPage(function(err, records) {
        if(err || records.length !== 1) {
          console.error(err, "retrieve update error");
          reject("record not found");
        }
        else {
          const result = {
            email: records[0].get('Email'),
            sms: records[0].get('SMS'),
            pushertoken: records[0].get('Pusher Token'),
            preference: records[0].get('Preference')
          };
          resolve(result);
        }
      });
    })
  )

  const _updateRepresentativeToken = async (representativeId:string, token:string) => (
    new Promise((resolve, reject) => {
      twiceBase(EnumAirtables.REPRESENTATIVE).select({
          pageSize: 1,
          view: "Grid view",
          filterByFormula: `{Representative Id}='${representativeId}'`
      }).firstPage(function(err, records) {
        if(err || records.length !== 1) {
          console.error(err, "retrieve update error");
          reject("record not found");
        }
        else {
          twiceBase(EnumAirtables.REPRESENTATIVE).update([
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

  const _findOrderInformation = async (partnerId: string, orderId: string) => (
    new Promise((resolve, reject) => {
      twiceBase(EnumAirtables.ORDER).select({
          pageSize: 1,
          view: "Grid view",
          filterByFormula: `AND({Order Id}='${orderId}', {Business Partner Id} = '${partnerId}')`
      }).firstPage(function(err, records) {
        if(err || records.length !== 1) {
          console.error(err, 'retrieve update error');
          reject('retrieve error');
        }
        else {
          const response = {
            contactType: records[0].get('Contact Type'),
            contactInfo: records[0].get('Contact Info')
          };
          resolve(response);
        }
      });
    })
  )

  const _getContactInformation = async (partnerId: string, orderId: string) => {
    const orderQuery = new Promise((resolve, reject) => {
      twiceBase(EnumAirtables.ORDER).select({
          pageSize: 1,
          view: "Grid view",
          filterByFormula: `AND({Order Id}='${orderId}', {Business Partner Id} = '${partnerId}')`
      }).firstPage(function(err, records) {
        if(err || records.length !== 1) {
          console.error(err, 'retrieve update error');
          reject('retrieve error');
        }
        else {
          const response = {
            contactType: records[0].get('Contact Type'),
            contactInfo: records[0].get('Contact Info')
          };
          resolve(response);
        }
      });
    });
    const {contactType, contactInfo} = (await orderQuery) as any;
    switch(contactType) {
      case 'Representative':
        {
          const {email, sms, pushertoken, preference} = (await _findRepresentativeInfo(contactInfo)) as any;
          let userContactInfo = '';
          let userContactType = (preference as T_ORDER_CONTACT_TYPE);

          switch(userContactType) {
            case 'SMS':
              userContactInfo = sms;
              break;
            case 'Email':
              userContactInfo = email;
              break;
            case 'Push Notification':
              userContactInfo = pushertoken;
              break;
          }

          return {
            contactType: userContactType,
            contactInfo: userContactInfo
          };
        }
        break;
      default:
        return {
          contactInfo,
          contactType
        }
    }
  }

  const _getLockerInformation = async (partnerId:string, orderId:string, origin:string) => (
    new Promise((resolve, reject) => {
      twiceBase(EnumAirtables.LOCK).select({
          pageSize: 10,
          view: "Grid view",
          filterByFormula: `AND({Order Id}='${orderId}', {Business Partner Id} = '${partnerId}')`
      }).firstPage(function(err, records) {
        if(err || records.length < 1) {
          console.error(err, 'retrieve error');
          reject('retrieve error');
        }
        else {
          const lockerIds = records.map(record => record.get('Locker Id'));
          const result = {
            pin: records[0].get('PIN'),
            businessPartnerId: records[0].get('Business Partner Id'),
            lockerIds: lockerIds
          };
          resolve(result);
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
    twiceBase(table).create(
      values,
      callback
    );
  }

  const _createSmarthomeLog = (deviceId: string, action:string, callback = defaultCallback) => {
    const values = [{
        "fields":{
          "Device Id": deviceId,
          "Action": action
        }
      }];

    smarthomeBase(EnumAirtables.SMARTHOME_ACTION_LOG).create(
      values,
      callback
    );
  }

  const _createSmarthome = (deviceId: string, action:string, callback = defaultCallback) => {
    const values = [{
        "fields":{
          "Device Id": deviceId,
          "Action": action
        }
      }];

    smarthomeBase(EnumAirtables.SMARTHOME_STATUS).create(
      values,
      callback
    );
  }

  const _updateSmarthome = async (deviceId: string, action:string, callback = defaultCallback) => {
    new Promise((resolve, reject) => {
      smarthomeBase(EnumAirtables.SMARTHOME_STATUS).select({
          pageSize: 1,
          view: "Grid view",
          filterByFormula: `{Device Id}='${deviceId}'`
      }).firstPage(function(err, records) {
        if(err || records.length !== 1) {
          console.error(err, "retrieve update error");
          reject("record not found");
        }
        else {
          smarthomeBase(EnumAirtables.SMARTHOME_STATUS).update([
            {
              "Device Id": deviceId,
              "fields": {
                "Action": action
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
  }

  const _findSmarthomeStatus = async (deviceId: string, callback = defaultCallback) => {
    new Promise((resolve, reject) => {
      smarthomeBase(EnumAirtables.SMARTHOME_STATUS).select({
          pageSize: 1,
          view: "Grid view",
          filterByFormula: `{Device Id}='${deviceId}'`
      }).firstPage(function(err, records) {
        console.log(deviceId, "deviceId");
        if(err || records.length !== 1) {
          console.error(err, 'retrieve get error');
          reject('retrieve error');
        }
        else {
          const response = {
            action: records[0].get('Action')
          };
          console.log(action, 'action');
          resolve(response);
        }
      });
    })
  }

  return {
    create: _create,
    createSmarthomeLog: _createSmarthomeLog,
    createSmarthome: _createSmarthome,
    buildLockLog: _buildLockLog,
    buildOrder: _buildOrder,
    buildOrderLog: _buildOrderLog,
    getAvailableOrders: _getAllAvailableOrders,
    getCurrentLockStatuses: _getAllCurrentLockStatus,
    updateOrder: _updateOrder,
    updateLock: _updateLock,
    updateSmarthome: _updateSmarthome,
    findRepresentativeInfo: _findRepresentativeInfo,
    findOrderInformation: _findOrderInformation,
    findContactInformation: _getContactInformation,
    findRepresentativeOrders: _findRepresentativeOrders,
    findSmarthomeStatus: _findSmarthomeStatus,
    updateRepresentativeToken: _updateRepresentativeToken,
    getLockerInformation: _getLockerInformation
  };
}
