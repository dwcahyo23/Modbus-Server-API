/* eslint-disable import/no-import-module-exports */
/* eslint-disable import/no-extraneous-dependencies */
import pkg from 'modbus-serial';
import axios from 'axios';

const ModbusRTU = pkg;

let client = new ModbusRTU();
let timeoutRunRefHoldings = null;
let timeoutConnectRef = null;

const networkErrors = [
  'ESOCKETTIMEDOUT',
  'ETIMEDOUT',
  'ECONNRESET',
  'ECONNREFUSED',
  'EHOSTUNREACH',
  'ENETRESET',
  'ECONNABORTED',
  'ENETUNREACH',
  'ENOTCONN',
  'ESHUTDOWN',
  'EHOSTDOWN',
  'ENETDOWN',
  'EWOULDBLOCK',
  'EAGAIN',
];

// check error, and reconnect if needed
const checkError = (e) => {
  if (e.errno && networkErrors.includes(e.errno)) {
    console.log('we have to reconnect');

    // close port
    client.close();

    // re open client
    client = new ModbusRTU();
    timeoutConnectRef = setTimeout(connect, 1000);
  }
};

// open connection to a serial port
const connect = () => {
  // clear pending timeouts
  clearTimeout(timeoutConnectRef);
  // if client already open, just run
  if (client.isOpen) {
    run();
  }

  // if client closed, open a new connection
  client.connectTCP('10.23.19.60', { port: 502 })
    .then(setClient)
    .then(() => {
      console.log('Connected');
    })
    .catch((e) => {
      checkError(e);
      console.log(e.message);
    });
};

const setClient = () => {
  // set the client's unit id
  // set a timout for requests default is null (no timeout)
  client.setID(1);
  client.setTimeout(3000);

  // run program
  run();
};

const run = () => {
  clearTimeout(timeoutRunRefHoldings);

  client.readHoldingRegisters(768, 5)
    .then((d) => {
      console.log('Receive Holding Register Panel B1:', d.data);
      // axios({
      //   method: 'post',
      //   url: 'http://localhost:5000/modbus',
      //   data: {
      //     name: 'Panel B1',
      //     data: d.data,
      //   },
      // });
    })
    .then(() => {
      timeoutRunRefHoldings = setTimeout(run, 10000);
    })
    .catch((e) => {
      checkError(e);
      console.log(e.message);
    });
};

// connect and start logging
connect();
