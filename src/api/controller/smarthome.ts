//This is a project for home
import persistance from "./persistance";
import {mockResponseApi} from "./_genericapi";
import publishsubscribe from "./publishsubscribe";
import {smarthome} from "actions-on-google";
import {google} from "googleapis";

const {SMARTHOME_ACCESS_TOKEN, SMARTHOME_REFRESH_TOKEN, SMARTHOME_AUTH_TOKEN} = process.env;
const {SMARTHOME_USER_ID, SMARTHOME_CLIENT_ID, SMARTHOME_SECRET_ID} = process.env;

const chewySmarthome = {
  monitor: async function(req, res) {
    res.json({'status': 'initiated reader'});
  },
  trigger: async function(req, res) {
    const action = req.body.action;
    const id = req.params.id;

    const smarthomeReq = {
      body: {
        action: action
      },
      params: {
        id: id
      }
    }

    persistance.createSmarthomeLog(smarthomeReq, mockResponseApi());
    publishsubscribe.writeSmarthome(smarthomeReq, mockResponseApi());

    res.json({'status': 'initiated order'});
  },
  login: async function(request, response) {
    if (request.method === 'GET') {
      response.send(`
      <html>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <body>
          <form action="/api/smarthome/login" method="post">
            <input type="hidden"
              name="responseurl" value="${request.query.responseurl}" />
            <button type="submit" style="font-size:14pt">
              Link this service to Google
            </button>
          </form>
        </body>
      </html>
    `);
    } else if (request.method === 'POST') {
      const responseurl = decodeURIComponent(request.body.responseurl);
      return response.redirect(responseurl);
    }
  },
  auth: function(request, response) {
    const responseurl = `${decodeURIComponent(request.query.redirect_uri)}?code=${SMARTHOME_AUTH_TOKEN}&state=${request.query.state}`;
    if(request.query.client_id === SMARTHOME_CLIENT_ID) {
      return response.redirect(
          `/api/smarthome/login?responseurl=${encodeURIComponent(responseurl)}`);
    }
    else {
      response.send(`
        <html>
          <meta name="viewport" content="width=device-width, initial-scale=1">
          <body>
            <h2>Invalid</h2>
          </body>
        </html>
      `);
    }
  },
  token: function(request, response) {
    const grantType = request.query.grant_type ?
      request.query.grant_type : request.body.grant_type;
    const secondsInDay = 86400; // 60 * 60 * 24
    const HTTP_STATUS_OK = 200;
    const HTTP_STATUS_ERROR = 400;

    let obj;
    if (grantType === 'authorization_code') {
      if(request.body.client_secret === SMARTHOME_SECRET_ID) {
        obj = {
          token_type: 'bearer',
          access_token: SMARTHOME_ACCESS_TOKEN,
          refresh_token: SMARTHOME_REFRESH_TOKEN,
          expires_in: secondsInDay,
        };
      }
    } else if (grantType === 'refresh_token') {
      obj = {
        token_type: 'bearer',
        access_token: SMARTHOME_ACCESS_TOKEN,
        expires_in: secondsInDay,
      };
    }

    if(obj.token_type === 'bearer') {
      response.status(HTTP_STATUS_OK)
          .json(obj);
    }
    else {
      response.status(HTTP_STATUS_ERROR)
          .json({});
    }
  },
  createApp: function() {
    const updateDevice = async (execution, deviceId) => {
      const {params, command} = execution;

      let state; let ref;
      switch (command) {
        case 'action.devices.commands.OnOff':
          params.on = !params.on
          state = {on: params.on};
          break;
        case 'action.devices.commands.StartStop':
          params.isRunning = !params.isRunning
          state = {isRunning: !params.isRunning};
          break;
        case 'action.devices.commands.PauseUnpause':
          params.pause = !params.pause
          state = {isPaused: !params.pause};
          break;
      }


      const smarthomeLogReq = {
        body: {
          action: JSON.stringify(state)
        },
        params: {
          id: deviceId
        }
      }
      const smarthomeReq = {
        body: {
          action: JSON.stringify(execution)
        },
        params: {
          id: deviceId
        }
      }

      persistance.createSmarthomeLog(smarthomeLogReq, mockResponseApi());
      persistance.updateSmarthome(smarthomeReq, mockResponseApi());
      publishsubscribe.writeSmarthome(smarthomeReq, mockResponseApi());

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

        const smarthomeReq = {
          params: {
            id: deviceId
          }
        }

        const actionResponse = mockResponseApi();
        persistance.findSmarthome(smarthomeReq, actionResponse);
        const deviceResponseInJson = actionResponse.getJson();
        if(deviceResponseInJson && deviceResponseInJson.action) {
          payload.devices[deviceId] = JSON.parse(deviceResponseInJson.action);
        }
        else {
          const defaultStatus = {
            on: true,
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

          payload.devices[deviceId] = defaultStatus

          const smarthomeReq = {
            body: {
              action: JSON.stringify(defaultStatus)
            },
            params: {
              id: deviceId
            }
          }
          persistance.createSmarthomeLog(smarthomeReq, mockResponseApi());
          persistance.createSmarthome(smarthomeReq, mockResponseApi());
        }
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
      } as any;
    });

    app.onDisconnect((body, headers) => {
      console.log('User account unlinked from Google Assistant');
      return {};
    });
    return app;
  }
};

export default chewySmarthome;
