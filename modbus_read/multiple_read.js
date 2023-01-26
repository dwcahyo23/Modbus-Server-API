/* eslint-disable prefer-const */
/* eslint-disable no-promise-executor-return */
/* eslint-disable no-await-in-loop */
/* eslint-disable no-restricted-syntax */
import pkg from 'modbus-serial';

const ModbusRTU = pkg;

const client = new ModbusRTU();

const IP_ADDRESS = [
  { ip: '10.23.19.60', port: 502, id: 1 },
  { ip: '10.23.29.139', port: 502, id: 1 }];

const getValues = async (datas) => {
  try {
    if (client.isOpen) {
      client.close();
    }
    for (const data of datas) {
      console.log(await getVal(data));
      await sleep(500);
    }
  } catch (e) {
    console.log(e);
  }
};

const getVal = async (d) => {
  try {
    // console.log('getval:', d.ip);
    await client.connectTCP(d.ip, { port: 502 })
      .then(() => {
        client.setID(d.id);
        client.setTimeout(3000);
      });
    let val = await client.readHoldingRegisters(1304, 10);
    client.close();
    await client.close();
    return val.buffer.readUInt32BE();
  } catch (e) {
    return -1;
  }
};

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

setInterval(() => {
  getValues(IP_ADDRESS);
}, 10000);
