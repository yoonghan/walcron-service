//This is a project for home
import persistance from "./persistance";
import {mockResponseApi} from "./_genericapi";
import publishsubscribe from "./publishsubscribe";

const smarthome = {
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
  }
};

export default smarthome;
