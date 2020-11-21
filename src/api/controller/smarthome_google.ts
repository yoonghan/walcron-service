'use strict';

const {smarthome} = require('actions-on-google');
const {google} = require('googleapis');

const {SMARTHOME_USER_ID} = process.env;

const updateDevice = async (execution, deviceId) => {
  const {params, command} = execution;
  let state; let ref;
  switch (command) {
    case 'action.devices.commands.OnOff':
      state = {on: params.on};
      break;
    case 'action.devices.commands.StartStop':
      state = {isRunning: params.start};
      break;
    case 'action.devices.commands.PauseUnpause':
      state = {isPaused: params.pause};
      break;
  }

  return state;
};

const app = smarthome({
  debug: true
});

app.onSync((body) => {
  //https://developers.google.com/assistant/smarthome/concepts/devices-traits
  return {
    requestId: body.requestId,
    payload: {
      agentUserId: SMARTHOME_USER_ID,
      devices: [{
        id: 'walcroncontroller',
        type: 'action.devices.types.WASHER',
        traits: [
          'action.devices.traits.OnOff',
          'action.devices.traits.StartStop',
          'action.devices.traits.RunCycle',
        ],
        name: {
          defaultNames: ['My Chewy'],
          name: 'Chewy',
          nicknames: ['Chewy'],
        },
        deviceInfo: {
          manufacturer: 'Walcron',
          model: 'acme-walcron',
          hwVersion: '1.0',
          swVersion: '1.0.1',
        },
        willReportState: true,
        attributes: {
          pausable: true,
        },
      }],
    },
  };
});

app.onQuery(async (body) => {
  const {requestId} = body;
  const payload = {
    devices: {},
  };
  const intent = body.inputs[0];
  for (const device of intent.payload.devices) {
    const deviceId = device.id;
    payload.devices[deviceId] = {
      on: false,
      isPaused: false,
      isRunning: false,
      currentRunCycle: [{
        currentCycle: 'rinse',
        nextCycle: 'spin',
        lang: 'en',
      }],
      currentTotalRemainingTime: 1212,
      currentCycleRemainingTime: 301,
    };
  }
  return {
    requestId: requestId,
    payload: payload,
  };
});

app.onExecute(async (body) => {
  const {requestId} = body;
  // Execution results are grouped by status
  const result = {
    ids: [],
    status: 'SUCCESS',
    states: {
      online: true,
    },
  };

  const executePromises = [];
  const intent = body.inputs[0];
  for (const command of intent.payload.commands) {
    for (const device of command.devices) {
      for (const execution of command.execution) {
        executePromises.push(
            updateDevice(execution, device.id)
                .then((data) => {
                  result.ids.push(device.id);
                  Object.assign(result.states, data);
                })
                .catch(() => console.error('EXECUTE', device.id)));
      }
    }
  }

  await Promise.all(executePromises);
  return {
    requestId: requestId,
    payload: {
      commands: [result],
    },
  };
});

app.onDisconnect((body, headers) => {
  console.log('User account unlinked from Google Assistant');
  return {};
});

export default app;
