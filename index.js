/* eslint-disable import/no-extraneous-dependencies */
import express from 'express';
import { Server } from 'socket.io';
import { createServer } from 'http';
import * as dotenv from 'dotenv';
import cors from 'cors';

import axios from 'axios';
import { format } from 'date-fns';
import { setIntervalAsync } from 'set-interval-async';

import { kompresor } from './modbus_read/kompresor.js';
import { panel_b1 } from './modbus_read/panel_b1.js';

dotenv.config();

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

io.on('connection', (socket) => {
  socket.emit('message', 'Connecting');

  const update_db = async (result) => {
    let response = null;
    await axios({
      method: 'post',
      url: 'http://localhost:5000/modbus',
      data: {
        name: result.name,
        data: { kwh: result.buffer.readUInt32BE(), date: new Date() },
      },
    })
      .then((res) => { response = res; })
      .catch((err) => { response = err; });
    return response;
  };

  const update_ui = async (result) => {
    if (result.status === 200) {
      socket.emit('message', `${format(new Date(), 'HH:mm:ss')}: ${result.config.data}`);
    } else {
      socket.emit('message', `${format(new Date(), 'HH:mm:ss')}: ${result.message}`);
    }
  };

  const run = setIntervalAsync(async () => {
    await kompresor().then(update_db).then(update_ui).catch(update_ui);
    await panel_b1().then(update_db).then(update_ui).catch(update_ui);
  }, 10000);
});

httpServer.listen(process.env.PORT_APP, () => {
  console.log(`Server up & running in ${process.env.PORT_APP}`);
});
