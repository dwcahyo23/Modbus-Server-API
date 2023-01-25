/* eslint-disable import/no-extraneous-dependencies */
import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import * as dotenv from 'dotenv';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import axios from 'axios';

import { kompresor } from './modbus_read/kompresor.js';
import { panel_b1 } from './modbus_read/panel_b1.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const port = process.env.PORT;
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({
  extended: true,
}));

app.get('/', (req, res) => {
  res.sendFile('index.html', {
    root: __dirname,
  });
});

function onFulfilled(result) {
  // console.log(result.name);
  axios({
    method: 'post',
    url: 'http://localhost:5000/modbus',
    data: {
      name: result.name,
      data: result.data,
    },
  });
  return result;
}

io.on('connection', (socket) => {
  socket.emit('message', 'Connecting');
  setInterval(() => {
    kompresor()
      .then(onFulfilled)
      .then((result) => socket.emit('message', `name: ${result.name}, data: ${result.data}`))
      .catch((err) => socket.emit('message', `${err.name}, ${err.message}`));

    panel_b1()
      .then(onFulfilled)
      .then((result) => socket.emit('message', `name: ${result.name}, data: ${result.data}`))
      .catch((err) => socket.emit('message', `${err.name}, ${err.message}`));
  }, 10000);
});

httpServer.listen(port, () => {
  console.log(`Server up & running in ${port}`);
});
