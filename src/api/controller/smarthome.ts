//This is a project for home
import persistance from "./persistance";
import {mockResponseApi} from "./_genericapi";
import publishsubscribe from "./publishsubscribe";

const {SMARTHOME_ACCESS_TOKEN, SMARTHOME_REFRESH_TOKEN, SMARTHOME_AUTH_TOKEN} = process.env;

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
  },
  login: async function(request, response) {
    if (request.method === 'GET') {
      response.send(`
      <html>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <body>
          <form action="/login" method="post">
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
    } else {
      // Unsupported method
      response.send(405, 'Method Not Allowed');
    }
  },
  auth: function(request, response) {
    const responseurl = `${decodeURIComponent(request.query.redirect_uri)}?code=${SMARTHOME_AUTH_TOKEN}&state=${request.query.state}`;
    return response.redirect(
        `/login?responseurl=${encodeURIComponent(responseurl)}`);
  },
  token: function(request, response) {
    const grantType = request.query.grant_type ?
      request.query.grant_type : request.body.grant_type;
    const secondsInDay = 86400; // 60 * 60 * 24
    const HTTP_STATUS_OK = 200;

    let obj;
    if (grantType === 'authorization_code') {
      obj = {
        token_type: 'bearer',
        access_token: SMARTHOME_ACCESS_TOKEN,
        refresh_token: SMARTHOME_REFRESH_TOKEN,
        expires_in: secondsInDay,
      };
    } else if (grantType === 'refresh_token') {
      obj = {
        token_type: 'bearer',
        access_token: SMARTHOME_ACCESS_TOKEN,
        expires_in: secondsInDay,
      };
    }
    response.status(HTTP_STATUS_OK)
        .json(obj);
  }
};

export default smarthome;
