import cors from 'cors';

import general from './controller/general';

import root from './controller/root';
import locker from './controller/locker';
import order from './controller/order';

var webCorsOptions = {
  origin: process.env.ALLOWED_CROSS_ORIGIN_WEB,
  optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
}

var appCorsOptions = {
  origin: process.env.ALLOWED_CROSS_ORIGIN_APP,
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
          if(route.startsWith('/app')) {
            app[key](route, cors(appCorsOptions), a[key]);
          }
          else {
            app[key](route, cors(webCorsOptions), a[key]);
          }

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
        get: order.getAvailableOrders,
        post: order.placeOrder,
        options: general.preflight
      }
    },
    '/app/api': {
      '/locker/users/:userid/notification': {
        put: locker.updateUserNotification,
        options: general.preflight
      },
      '/locker/users/:userid/orders': {
        get: order.getUserOrders,
        options: general.preflight
      }
    }
   });
};
