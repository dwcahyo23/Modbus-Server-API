import express, { response } from 'express'
import { Server } from 'socket.io'
import { createServer } from 'http'
import * as dotenv from 'dotenv'
import cors from 'cors'
import path, { resolve } from 'path'
import logger from 'morgan'

import axios from 'axios'
import { format } from 'date-fns'
import { setIntervalAsync } from 'set-interval-async/fixed'
import Modbus from './modbus_app/modbus'
import _, { reject } from 'lodash'

dotenv.config()
const app = express()
app.use(logger('dev'))
const httpServer = createServer(app)
const io = new Server(httpServer)

app.use(cors())
app.use(express.json())
app.use(
    express.urlencoded({
        extended: true,
    })
)

app.get('/', (req, res) => {
    res.sendFile('index.html', {
        root: path.join(__dirname, '../public'),
    })
})

// handle uncaught exceptions
process.on('uncaughtException', function (error) {
    console.log('Error', error.message)
})

io.on('connection', (socket) => {
    socket.emit('message', 'Connecting')

    const updateUi = async (params) => {
        if (params.error) {
            socket.emit(
                'message',
                `${format(new Date(), 'dd/MM/yy HH:mm:ss')}: ${params.message} `
            )
        }
        socket.emit(
            'message',
            `${format(new Date(), 'dd/MM/yy HH:mm:ss')}: ${JSON.stringify(
                params,
                null,
                2
            )} `
        )
    }

    const inDB = (params) => {
        axios
            .post('http://localhost:5000/insResultAddress', {
                ...params,
            })
            .catch((error) => {
                console.log('Error', error.message)
            })
    }

    const ModbusRun = setIntervalAsync(async () => {
        try {
            Modbus.getModbusApp().then((res) => {
                _.forEach(res.data, async (data, i) => {
                    await Modbus.readModbusDevice(data)
                        .then(async (res) => {
                            await updateUi({ ...res })
                            inDB({ ...res })
                        })
                        .catch((error) => {
                            console.log(error.message)
                            updateUi({ error: true, message: error.message })
                        })
                })
            })
        } catch (error) {
            console.log(error.message)
        }
    }, 10000)
})

httpServer.listen(process.env.PORT_APP, () => {
    console.log(`Server up & running in ${process.env.PORT_APP}`)
})
