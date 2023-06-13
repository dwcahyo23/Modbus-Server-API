const ModbusRTU = require('modbus-serial')
import axios from 'axios'
import _ from 'lodash'

export default {
    async getModbusApp() {
        return new Promise((resolve, reject) => {
            try {
                axios.get('http://localhost:5000/getAddress').then((result) => {
                    resolve(result)
                })
            } catch (error) {
                reject(
                    new Error(`${error.message}, check connection from backend`)
                )
            }
        })
    },

    async readModbusDevice(params) {
        return new Promise(async (resolve, reject) => {
            try {
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
                                count: result.data[
                                    params.holdReg_count - address
                                ],
                                run: result.data[params.holdReg_run - address],
                            }))
                            .then((result) => {
                                // console.log(
                                //     `${params.mch_code}, read holding register: \ncount: ${result.count} \nrun: ${result.run}\n`
                                // )
                                const data = {
                                    ...params,
                                    ...result,
                                }

                                resolve(data)
                            })
                    })
            } catch (error) {
                reject(
                    new Error(
                        ` ${params.mch_code} ${error.message}, check device modbus`
                    )
                )
            }
        })
    },
}
