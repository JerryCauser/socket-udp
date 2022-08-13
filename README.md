# UDP Socket 
[![npm](https://img.shields.io/npm/v/udp-socket)](https://www.npmjs.com/package/udp-socket)
[![tests](https://img.shields.io/github/workflow/status/JerryCauser/udp-socket/tests?label=tests&logo=github)](https://github.com/JerryCauser/udp-socket/actions/workflows/tests.yml)
[![LGTM Grade](https://img.shields.io/lgtm/grade/javascript/github/JerryCauser/udp-socket)](https://lgtm.com/projects/g/JerryCauser/udp-socket)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![GitHub](https://img.shields.io/github/license/JerryCauser/udp-socket)](https://github.com/JerryCauser/udp-socket/blob/master/LICENSE)

UDP Socket and Client with built-in encryption

- Fast — little overhead above UDP to send messages
- Secure — built-in encryption for sensitive data
- Simple — used well-known Node streams to manipulate and move data
- Zero-dependency
- ESM and CJS

## Install

```bash
npm i --save udp-socket
```

## Fast Start

```javascript
//app.js
import { UDPClient } from 'udp-socket'

const client = new UDPClient({
  port: 44002,
  encryption: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff' // 64chars
})

client.send(Buffer.from('Hello, World!'))
```

```javascript
//server.js
import { UDPSocket, parseMessage } from 'udp-socket'

const socket = new UDPSocket({
  port: 44002,
  decryption: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff' // 64chars
})

for await (const message of socket) {
  const req = parseMessage(message)
  
  console.log(req.body.toString())
}

```

After just start the server `node server.js` and start your app `node app.js`. That's all, you've just sent and received encrypted message. 

## Documentation

### class `UDPClient`
Extends [`EventEmitter`][node-eventemitter]

#### Arguments:
- `options` `<object>` – optional
  - `type` `<'udp4' | 'udp6'>` – optional. **Default** `'udp4'`
  - `port` `<string | number>` – optional. **Default** `44002`
  - `host` `<string>` – optional. **Default** `'127.0.0.1'` or `'::1'`
  - `packetSize` `<number>` – optional. Number of bytes in each packet (chunk). **Default** `1280`
  - `encryption` `<string> | <(payload: Buffer) => Buffer>` – optional. **Default** `undefined`
    - if passed `string` - will be applied `aes-256-ctr` encryption with passed string as a secret, so it should be `64char` long;
    - if passed `function` - will be used that function to encrypt every message;
    - if passed `undefined` - will not use any kind of encryption.

#### Methods:
- `send (body: Buffer)`: `<void>` – send binary data

#### Events:
##### Event: `'ready'`
Emitted when the client "establishes" udp connection.

#### Usage
##### Simple example with encryption
```javascript
import { UDPClient } from 'udp-socket'

const client = new UDPClient({
  port: 44002,
  // encryption: (buf) => buf.map(byte => byte ^ 83) // simple encryption function for example 
  encryption: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff'
})

client.send(Buffer.from('hi!'))
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
  - `decryption` `<string> | <(payload: Buffer) => Buffer>` – optional. **Default** `undefined`
    - if passed `string` - will be applied `aes-256-ctr` decryption with passed string as a secret, so it should be `64char` long;
    - if passed `function` - will be used that function to decrypt every message;
    - if passed `undefined` - will not use any kind of decryption.
  - `gcIntervalTime` `<number>` — optional. How often instance will check internal buffer to delete expired messages (in ms). **Default** `5000` 
  - `gcExpirationTime` `<number>`— optional. How long chunks can await all missing chunks in internal buffer (in ms). **Default** `10000`

#### Fields:
- `port`: `<number>`
- `address`: `<string>`

#### Events:
All `Readable` events of course and:

##### Event: `'ready'`
Emitted when socket started and ready to receive data.

##### Event: `'data'`
Emitted right after a message was received completely.
  - `message` `<Buffer>`

##### Event: `'warning'`
Emitted when warning occurs.
 - `payload` `<object | Error>`
   - `message` `<string>`
   - `id` `<string>` – optional
   - `date` `<Date>` – optional

A message might be:
   - `missing_message` – when some messages didn't receive all chunks and got expired

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
  // decryption: (buf) => buf.map(byte => byte ^ 83) // simple encryption function for example
  decryption: '11223344556677889900aabbccddeeff11223344556677889900aabbccddeeff'
})

for await (const message of socket) {
  /*handle messages*/
}
```
---

### Additional Exposed variables and functions
#### constant `DEFAULT_PORT`
- `<number>` : `44002`
- 
#### function `getBody(message)`
 - `message` `<Buffer>`
 - Returns: `<Buffer>`

Function to pick out the body (payload you've sent without meta info) from message. For more info, you can check the source files.

---

There are `_identifier` and `_constants` exposed also, but they are used for internal needs. They could be removed in next releases, so it is not recommended to use it in your project.  

---

License ([MIT](LICENSE))

[node-eventemitter]: https://nodejs.org/api/events.html#class-eventemitter
[node-readable]: https://nodejs.org/api/stream.html#class-streamreadable
[client]: #class-udpclient
[socket]: #class-udpsocket
[constants]: src/constants.js
[socket-event-warning]: #event-warning
