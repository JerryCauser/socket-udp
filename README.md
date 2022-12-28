# UDP Socket
[![npm](https://img.shields.io/npm/v/socket-udp)](https://www.npmjs.com/package/socket-udp)
[![tests](https://github.com/JerryCauser/socket-udp/actions/workflows/tests.yml/badge.svg)](https://github.com/JerryCauser/socket-udp/actions/workflows/tests.yml)
[![CodeQL](https://github.com/JerryCauser/socket-udp/actions/workflows/codeql.yml/badge.svg)](https://github.com/JerryCauser/socket-udp/actions/workflows/codeql.yml)
[![CodeFactor Grade](https://img.shields.io/codefactor/grade/github/JerryCauser/socket-udp/master)](https://www.codefactor.io/repository/github/jerrycauser/socket-udp)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![node-current](https://img.shields.io/node/v/socket-udp)](https://nodejs.org)
[![GitHub](https://img.shields.io/github/license/JerryCauser/socket-udp)](https://github.com/JerryCauser/socket-udp/blob/master/LICENSE)

Plain UDP Socket and Client

- Fast — little overhead above UDP to send messages
- Simple — used well-known Node streams to manipulate and move data
- Zero-dependency
- ESM and CJS

## Install

```bash
npm i --save socket-udp
```

## Fast Start

```javascript
//app.js
import { UDPClient } from 'socket-udp'

const client = new UDPClient({ port: 44002 })

client.write(Buffer.from('Hello, World!', 'utf8'))
```

```javascript
//server.js
import { UDPSocket } from 'socket-udp'

const socket = new UDPSocket({ port: 44002 })

for await (const message of socket) {
  console.log(message.toString('utf8'))
}

```

After just start the server `node server.js` and start your app `node app.js`. That's all, you've just sent and received message. 

## Documentation

### class `UDPClient`
Extends [`Writabable` Stream][node-writable]

#### Arguments:
- `options` `<object>` – optional
  - `type` `<'udp4' | 'udp6'>` – optional. **Default** `'udp4'`
  - `port` `<string | number>` – optional. **Default** `44002`
  - `address` `<string>` – optional. **Default** `'127.0.0.1'` or `'::1'`

#### Fields:
- `origin`: [`<dgram.Socket>`][node-dgram-socket]
- `port`: `<number>`
- `address`: `<string>`
- `family`: `<string>`

#### Events:
##### Event: `'ready'`
Emitted when the client "establishes" udp connection.

#### Usage
##### Simple example
```javascript
import { UDPClient } from 'socket-udp'

const client = new UDPClient({ port: 44002 })

client.write(Buffer.from('hi!', 'utf8'))
```
---

### class `UDPSocket`
Extends [`Readable` Stream][node-readable]

It is a UDP socket in `readable stream` form.

#### Arguments:
- `options` `<object>` – **required**
  - `type` `<'udp4' | 'udp6'>` – optional. **Default** `'udp4'`
  - `port` `<string | number>` – optional. **Default** `44002`
  - `address` `<string>` – optional **Default** `'127.0.0.1'` or `'::1'`

#### Fields:
- `origin`: [`<dgram.Socket>`][node-dgram-socket]
- `port`: `<number>`
- `address`: `<string>`
- `family`: `<string>`
- `allowPush`: `<boolean>`

#### Events:
All `Readable` events of course and:

##### Event: `'ready'`
Emitted when socket started and ready to receive data.

##### Event: `'data'`
Emitted right after a message was received
  - `message` `<Buffer>`

#### Methods:
- `handleMessage` `(body: Buffer, head: MessageHead) => void` – handles raw messages from [dgram.Socket][node-dgram-socket].
     If you need to handle data before any manipulation then overwrite it.

#### Usage

##### Example how to use socket as stream
```javascript
import fs from 'node:fs'
import { UDPSocket } from 'socket-udp'

const socket = new UDPSocket()
const writer = fs.createWriteStream('/some/path')

socket.pipe(writer)
```

##### Example how to use plain socket as async generator
```javascript
import { UDPSocket } from 'socket-udp'

const socket = new UDPSocket({ port: 44002 })

for await (const message of socket) {
  console.log(JSON.parse(message.toString('utf8')))
}
```

---

### Additional Exposed variables and functions
#### constant `DEFAULT_PORT`
- `<number>` : `44002`

---

License ([MIT](LICENSE))

[node-readable]: https://nodejs.org/api/stream.html#class-streamreadable
[node-writable]: https://nodejs.org/api/stream.html#class-streamwritable
[node-dgram-socket]: https://nodejs.org/api/dgram.html#class-dgramsocket
[client]: #class-udpclient
[socket]: #class-udpsocket
[constants]: src/constants.js
