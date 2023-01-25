/* eslint-disable prefer-promise-reject-errors */
import pkg from 'modbus-serial';

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
    panel_b1();
    // run();
  }

  // if client closed, open a new connection
  client.connectTCP('10.23.19.60', { port: 502 })
    .then(() => {
      client.setID(1);
      client.setTimeout(3000);
    })
    .then(() => {
      console.log('Panel B1 connected');
    })
    .catch((e) => {
      checkError(e);
      // console.log(e.message);
    });
};

export const panel_b1 = () => new Promise((resolve, reject) => {
  setTimeout(() => {
    if (client.isOpen) {
      resolve(
        client.readHoldingRegisters(768, 10)
          .then((result) => ({ ...result, name: 'panel_b1' })),
      );
    } else {
      connect();
      reject(new Error('waiting connection panel_b1'));
    }
  }, 1000);
});
