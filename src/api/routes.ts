import cors from 'cors';

import general from './controller/general';

import root from './controller/root';
import locker from './controller/locker';

var corsOptions = {
  origin: process.env.ALLOWED_CROSS_ORIGIN,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

module.exports = function(app) {
  app.map = function(a, route){
    route = route || '';
    for (var key in a) {
      switch (typeof a[key]) {
        case 'object':
          app.map(a[key], route + key);
          break;
        case 'function':
          app[key](route, cors(corsOptions), a[key]);
          break;
      }
    }
  };

   app.map({
    '/': {
     get: root.index
    },
    '/api': {
      '/locker/monitor': {
        get: locker.monitor
      },
      '/locker/trigger/:businesspartnerid/:partnerid': {
        post: locker.trigger,
        options: general.preflight
      },
      '/locker/order/:businesspartnerid/:partnerid': {
        get: locker.getAvailOrders,
        post: locker.placeOrder,
        options: general.preflight
      }
    }
   });
};
