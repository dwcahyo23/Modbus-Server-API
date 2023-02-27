const ModbusRTU = require('modbus-serial')
import { format } from 'date-fns'

let client = new ModbusRTU()

let timeoutConnectRef = null

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
]
export default {
    async get_data() {
        // check error, and reconnect if needed
        const checkError = (e) => {
            if (e.errno && networkErrors.includes(e.errno)) {
                console.log('we have to reconnect')

                // close port
                client.close()

                // re open client
                client = new ModbusRTU()
                timeoutConnectRef = setTimeout(connect, 1000)
            }
        }

        const connect = () => {
            // clear pending timeouts
            clearTimeout(timeoutConnectRef)

            if (client.isOpen) {
                this.get_data()
                // run();
            }

            // if client closed, open a new connection
            client
                .connectTCP('10.23.18.53', { port: 502 })
                .then(() => {
                    client.setID(5)
                    client.setTimeout(2000)
                })
                .then(() => {
                    console.log('Panel A connected')
                })
                .catch((e) => {
                    checkError(e)
                    // console.log(e.message);
                })
        }

        const buf4 = (result) => {
            const buf = Buffer.from(result)
            return buf.swap32().readUInt32BE(0)
        }

        const buf17 = (result) => {
            return parseInt(result, 16) * 1000000000
        }

        const data = async () => {
            const kwh = client.readHoldingRegisters(236, 20).then((result) => ({
                kwh:
                    (buf4([
                        result.buffer[0],
                        result.buffer[1],
                        result.buffer[2],
                        result.buffer[3],
                    ]) +
                        buf17(result.buffer[16])) /
                    100,
            }))
            const volt = client.readHoldingRegisters(0, 105).then((result) => ({
                i1: result.data[3],
                i2: result.data[9],
                i3: result.data[15],
                v1: result.data[1],
                v2: result.data[7],
                v3: result.data[13],
                f: result.data[99],
                act_p: result.data[47],
                rct_p: result.data[51],
                app_p: result.data[49],
                pwr_f: result.data[53],
            }))
            const [p1, p2] = await Promise.all([kwh, volt])
            return {
                data: {
                    ...p1,
                    ...p2,
                    date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                },
                name: 'panel_a',
            }
        }

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (client.isOpen) {
                    resolve(data())
                } else {
                    connect()
                    reject(new Error('waiting connection panel_a'))
                }
            }, 1000)
        })
    },
}
