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
    kompresor();
    // run();
  }

  // if client closed, open a new connection
  client.connectTCP('10.23.29.139', { port: 502 })
    .then(() => {
      client.setID(1);
      client.setTimeout(3000);
    })
    .then(() => {
      console.log('Kompresor connected');
    })
    .catch((e) => {
      checkError(e);
      // console.log(e.message);
    });
};

export const kompresor = () => new Promise((resolve, reject) => {
  setTimeout(() => {
    if (client.isOpen) {
      resolve(
        client.readHoldingRegisters(768, 10)
          .then((result) => ({ ...result, name: 'kompresor' })),
      );
    } else {
      connect();
      reject(new Error('waiting connection kompresor'));
    }
  }, 1000);
});
