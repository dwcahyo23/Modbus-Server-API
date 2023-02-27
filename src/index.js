import express from 'express'
import { Server } from 'socket.io'
import { createServer } from 'http'
import * as dotenv from 'dotenv'
import cors from 'cors'
import path from 'path'
import logger from 'morgan'

import axios from 'axios'
import { format } from 'date-fns'
import { setIntervalAsync } from 'set-interval-async'
import kompresor from './modbus_read/kompresor'
import panel_a from './modbus_read/panel_a'
import panel_b from './modbus_read/panel_b'
import panel_b1 from './modbus_read/panel_b1'
import panel_b2 from './modbus_read/panel_b2'
import panel_b2_1 from './modbus_read/panel_b2_1'

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

io.on('connection', (socket) => {
    socket.emit('message', 'Connecting')

    const update_db = async (result) => {
        let response = null
        await axios({
            method: 'post',
            url: 'http://localhost:5000/modbus',
            data: {
                name: result.name,
                data: result.data,
            },
        })
            .then((res) => {
                response = res
            })
            .catch((err) => {
                response = err
            })
        return response
    }

    const update_ui = async (result) => {
        if (result.status === 200) {
            socket.emit(
                'message',
                `${format(new Date(), 'HH:mm:ss')}: ${result.config.data}`
            )
        } else {
            socket.emit(
                'message',
                `${format(new Date(), 'HH:mm:ss')}: ${result.message}`
            )
            // socket.emit(
            //     'message',
            //     `${format(new Date(), 'HH:mm:ss')}: ${JSON.stringify(result)}`
            // )
        }
    }

    const run = setIntervalAsync(async () => {
        await kompresor
            .get_data()
            .then((res) => update_db(res))
            .then((res) => update_ui(res))
            .catch(update_ui)

        await panel_b1
            .get_data()
            .then((res) => update_db(res))
            .then((res) => update_ui(res))
            .catch(update_ui)

        await panel_b2
            .get_data()
            .then((res) => update_db(res))
            .then((res) => update_ui(res))
            .catch(update_ui)

        await panel_b2_1
            .get_data()
            .then((res) => update_db(res))
            .then((res) => update_ui(res))
            .catch(update_ui)

        await panel_a
            .get_data()
            .then((res) => update_db(res))
            .then((res) => update_ui(res))
            .catch(update_ui)

        await panel_b
            .get_data()
            .then((res) => update_db(res))
            .then((res) => update_ui(res))
            .catch(update_ui)
    }, 3000)
})

httpServer.listen(process.env.PORT_APP, () => {
    console.log(`Server up & running in ${process.env.PORT_APP}`)
})
