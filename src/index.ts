require('dotenv').config()
const express = require('express');
const routes = require('./api/routes');

const app = express();
const serverHost = process.env.HOST || 'localhost'
const serverPort = process.env.PORT || 3000

routes(app);

app.listen(serverPort, function() {
   console.log(`Server listening at http://${serverHost}:${serverPort}`);
});
