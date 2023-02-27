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
    get_data() {
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
            // if client already open, just run
            if (client.isOpen) {
                this.get_data()
                // run();
            }

            // if client closed, open a new connection
            client
                .connectTCP('10.23.29.139', { port: 502 })
                .then(() => {
                    client.setID(1)
                    client.setTimeout(3000)
                })
                .then(() => {
                    console.log('kompresor connected')
                })
                .catch((e) => {
                    checkError(e)
                    console.log(e.message)
                })
        }

        const data = async () => {
            const kwh = client
                .readHoldingRegisters(1304, 10)
                .then((result) => ({ kwh: result.buffer.readUInt32BE() }))
            const volt = client
                .readHoldingRegisters(768, 40)
                .then((result) => ({
                    i1: result.data[0],
                    i2: result.data[1],
                    i3: result.data[1],
                    v1: result.data[14],
                    v2: result.data[15],
                    v3: result.data[16],
                    f: result.data[22],
                    act_p: result.data[26],
                    rct_p: result.data[34],
                    app_p: result.data[38],
                    pwr_f: result.data[21],
                }))
            const [p1, p2] = await Promise.all([kwh, volt])
            return {
                data: {
                    ...p1,
                    ...p2,
                    date: format(new Date(), 'yyyy-MM-dd HH:mm:ss'),
                },
                name: 'kompresor',
            }
        }

        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (client.isOpen) {
                    resolve(data())
                } else {
                    connect()
                    reject(new Error('waiting connection kompresor'))
                }
            }, 1000)
        })
    },
}
