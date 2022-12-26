# UDP Socket 
[![npm](https://img.shields.io/npm/v/udp-socket)](https://www.npmjs.com/package/udp-socket)
[![tests](https://img.shields.io/github/workflow/status/JerryCauser/udp-socket/tests?label=tests&logo=github)](https://github.com/JerryCauser/udp-socket/actions/workflows/tests.yml)
[![LGTM Grade](https://img.shields.io/lgtm/grade/javascript/github/JerryCauser/udp-socket)](https://lgtm.com/projects/g/JerryCauser/udp-socket)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![GitHub](https://img.shields.io/github/license/JerryCauser/udp-socket)](https://github.com/JerryCauser/udp-socket/blob/master/LICENSE)

Plain UDP Socket and Client

- Fast — little overhead above UDP to send messages
- Simple — used well-known Node streams to manipulate and move data
- Zero-dependency
- Supports both: objectMode and raw data mode
- ESM and CJS

## Install

```bash
npm i --save udp-socket
```

## Fast Start

```javascript
//app.js
import { UDPClient } from 'udp-socket'

const client = new UDPClient({ port: 44002 })

client.send(Buffer.from('Hello, World!', 'utf8'))
```

```javascript
//server.js
import { UDPSocket } from 'udp-socket'

const socket = new UDPSocket({ port: 44002 })

for await (const message of socket) {
  console.log(message.toString('utf8'))
}

```

After just start the server `node server.js` and start your app `node app.js`. That's all, you've just sent and received message. 

## Documentation

### class `UDPClient`
Extends [`EventEmitter`][node-event-emitter]

#### Arguments:
- `options` `<object>` – optional
  - `type` `<'udp4' | 'udp6'>` – optional. **Default** `'udp4'`
  - `port` `<string | number>` – optional. **Default** `44002`
  - `host` `<string>` – optional. **Default** `'127.0.0.1'` or `'::1'`

#### Methods:
- `send (body: Buffer)`: `<void>` – send binary data

#### Events:
##### Event: `'ready'`
Emitted when the client "establishes" udp connection.

#### Usage
##### Simple example
```javascript
import { UDPClient } from 'udp-socket'

const client = new UDPClient({ port: 44002 })

client.send(Buffer.from('hi!', 'utf8'))
```
---

### class `UDPSocket`
Extends [`Readable` Stream][node-readable]

It is a UDP socket in `readable stream` form.

#### Arguments:
- `options` `<object>` – **required**
  - `type` `<'udp4' | 'udp6'>` – optional. **Default** `'udp4'`
  - `port` `<string | number>` – optional. **Default** `44002`
  - `host` `<string>` – optional **Default** `'127.0.0.1'` or `'::1'`
  - `headed` `<boolean>` – optional. **Default** `false`
  - `objectMode` `<boolean>` — optional. How often instance will check internal buffer to delete expired messages (in ms). **Default** `false` 

#### Fields:
- `port`: `<number>`
- `address`: `<string>`
- `headed`: `<boolean>`
- `origin`: [`<dgram.Socket>`][node-dgram-socket]

#### Events:
All `Readable` events of course and:

##### Event: `'ready'`
Emitted when socket started and ready to receive data.

##### Event: `'data'`
Emitted right after a message was received [and processed in `headed` and/or `objectMode`].
  - `message` `<Buffer>`

#### Methods:
- `handleMessage` `(body: Buffer, head: MessageHead) => void` – handles raw messages from [dgram.Socket][node-dgram-socket].
     If you need to manipulate data before any manipulation then overwrite it.

#### Static Methods:
- `serializeHead` `(head: MessageHead) => Buffer`
- `deserializeHead` `(payload: Buffer) => MessageHead` — Useful when `headed=true` and `objectMode=false`

#### Usage

##### Example how to use socket as stream
```javascript
import fs from 'node:fs'
import { UDPSocket } from 'udp-socket'

const socket = new UDPsocket()
const writer = fs.createWriteStream('/some/path')

socket.pipe(writer)
```

##### Example how to use pure socket as async generator
```javascript
import { UDPSocket } from 'udp-socket'

const socket = new UDPsocket({
  port: 44002,
  objectMode: true,
  headed: true
})

for await (const req of socket) {
  console.log({
    from: `${req.address}:${req.port}`,
    message: JSON.parse(req.body.toString('utf8'))
  })
}
```

##### Example where we use `UDPSocket.deserializeHead`
```javascript
import { UDPSocket } from 'udp-socket'

const socket = new UDPsocket({
  port: 44002,
  headed: true,
  objectMode: false
})

for await (const message of socket) {
  const req = UDPsocket.deserializeHead(message)
  
  console.log({
    from: `${req.address}:${req.port}`,
    message: JSON.parse(req.body.toString('utf8'))
  })
}
```
---

### Additional Exposed variables and functions
#### constant `DEFAULT_PORT`
- `<number>` : `44002`

---

License ([MIT](LICENSE))

[node-event-emitter]: https://nodejs.org/api/events.html#class-eventemitter
[node-readable]: https://nodejs.org/api/stream.html#class-streamreadable
[node-dgram-socket]: https://nodejs.org/api/dgram.html#class-dgramsocket
[client]: #class-udpclient
[socket]: #class-udpsocket
[constants]: src/constants.js
