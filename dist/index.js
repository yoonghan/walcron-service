require('dotenv').config();
const express = require('express');
const routes = require('./api/routes');
const backgroundServices = require('./services/background');
const app = express();
const serverHost = process.env.HOST || 'localhost';
const serverPort = process.env.PORT || 3001;
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
routes(app);
backgroundServices();
app.listen(serverPort, function () {
    console.log(`Server listening at http://${serverHost}:${serverPort}`);
});
