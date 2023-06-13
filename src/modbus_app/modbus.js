const ModbusRTU = require('modbus-serial')
import axios from 'axios'
import _, { reject } from 'lodash'

export default {
    Modbus() {
        const someErrors = []

        const getModbusApp = async () => {
            await axios
                .get('http://localhost:5000/getAddress')
                .then((response) => {
                    console.log('====== start read modbus ======')
                    _.forEach(response.data, async (data, i) => {
                        await connect(data)
                    })
                })
                .catch((error) => {
                    console.log(
                        `error in getModbusApp, check backend connection`
                    )
                    someErrors.push({
                        message: 'check backend connection',
                    })
                })
        }

        const connect = async (params) => {
            let client = new ModbusRTU()

            if (client.isOpen) {
                client.close()
            }
            await client
                .connectTCP(params.ip_address, {
                    port: params.port_address,
                })
                .then(() => {
                    client.setID(params.setId_address)
                    client.setTimeout(3000)
                })
                .then(() => {
                    const address = 600
                    const quantity = 50
                    client
                        .readHoldingRegisters(address, quantity)
                        .then((result) => ({
                            count: result.data[params.holdReg_count - address],
                            run: result.data[params.holdReg_run - address],
                        }))
                        .then((result) => {
                            console.log(
                                `${params.mch_code}, read holding register: \ncount: ${result.count} \nrun: ${result.run}\n`
                            )
                        })
                        .then(() => {
                            client.close()
                        })
                        .catch((error) => {
                            console.log(
                                `${params.mch_code} ${client.isOpen} ${error.message}\n`
                            )
                        })
                })
                .catch((error) => {
                    console.log(
                        `error in connect ${params.mch_code} ${client.isOpen} ${error.message}\n`
                    )
                })
        }
        return new Promise((resolve, reject) => {
            if (someErrors.length < 1) {
                resolve(getModbusApp())
            } else {
                reject(new Error(someErrors[0].message))
            }
        })
    },
}

// setInterval(() => {
//     getModbusApp()
// }, 10000)
