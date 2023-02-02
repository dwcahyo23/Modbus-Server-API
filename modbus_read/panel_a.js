/* eslint-disable no-shadow */
/* eslint-disable prefer-promise-reject-errors */
import pkg from 'modbus-serial';
import { format } from 'date-fns';

const ModbusRTU = pkg;

let client = new ModbusRTU();

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

const connect = () => {
  // clear pending timeouts
  clearTimeout(timeoutConnectRef);
  // if client already open, just run
  if (client.isOpen) {
    panel_a();
    // run();
  }

  // if client closed, open a new connection
  client.connectTCP('10.23.18.53', { port: 502 })
    .then(() => {
      client.setID(5);
      client.setTimeout(2000);
    })
    .then(() => {
      console.log('Panel A connected');
    })
    .catch((e) => {
      checkError(e);
      // console.log(e.message);
    });
};

const data = async () => {
  const kwh = client.readHoldingRegisters(236, 20)
    .then((result) => result);
  return kwh;
};

export const panel_a = () => new Promise((resolve, reject) => {
  setTimeout(() => {
    if (client.isOpen) {
      resolve(data());
    } else {
      connect();
      reject(new Error('waiting connection panel_a'));
    }
  }, 1000);
});

setInterval(() => {
  panel_a().then((res) => console.log(res)).catch((err) => console.log(err));
}, 10000);
