'use strict';

import root from './controller/root';
import locker from './controller/locker';

module.exports = function(app) {
  app.map = function(a, route){
    route = route || '';
    for (var key in a) {
      switch (typeof a[key]) {
        case 'object':
          app.map(a[key], route + key);
          break;
        case 'function':
          app[key](route, a[key]);
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
        get: locker.monitor,
        post: locker.invokeMonitor
      }
    }
   });
};
