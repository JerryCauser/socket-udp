import EventEmitter from 'node:events'
import dgram from 'node:dgram'
import { Buffer } from 'node:buffer'
import { Readable } from 'node:stream'
import { DEFAULT_PORT } from './constants.js'

/** @typedef {{address: string, family: ('IPv4'|'IPv6'), port: number, size: number, body?: Buffer}} MessageHead */

/**
 * @typedef {object} UDPSocketOptions
 * @property {string} [type='udp4']
 * @property {number} [port=44002]
 * @property {string} [host=('127.0.0.1'|'::1')]
 * @property {boolean} [objectMode=false] makes this stream to work in object mode with autoparse
 * @property {boolean} [headless=true] makes this stream to pass payload without meta info like ipaddress, port, etc.
 *       useful when you want to stream video or filedata right into file
 *
 * @extends {ReadableOptions}
 */

/**
 * @class UDPSocket
 * @param {UDPSocketOptions} [options={}]
 */
class UDPSocket extends Readable {
  /** @type {string} */
  #host

  /** @type {number} */
  #port

  /** @type {string} */
  #address

  /** @type {'udp4'|'udp6'} */
  #type

  /** @type {dgram.Socket} */
  #socket

  /** @type {boolean} */
  #objectMode = false

  /** @type {boolean} */
  #headless = true

  /** @type {boolean} */
  #allowPush = true

  /** @type {(string | Buffer | Uint8Array)[]} */
  #messages = []

  /** @type {function (data:Buffer, head:object):void} */
  #handleSocketMessage

  /** @type {function (object:Error):void} */
  #handleSocketError = (error) => {
    this.destroy(error)
  }

  /**
   * @param {UDPSocketOptions} [options]
   */
  constructor ({
    type = 'udp4',
    port = DEFAULT_PORT,
    host = type === 'udp4' ? '127.0.0.1' : '::1',
    decryption,
    headless = true,
    objectMode = false,
    ...readableOptions
  } = {}) {
    super({ ...readableOptions, objectMode })

    this.#port = port
    this.#host = host
    this.#type = type

    this.#headless = headless
    this.#objectMode = objectMode

    this.#handleSocketMessage = (data, head) => this.handleMessage(data, head)
  }

  _construct (callback) {
    this.#start()
      .then(() => callback(null))
      .catch(callback)
  }

  _destroy (error, callback) {
    if (error) {
      this.emit('error', error)
    }

    this.#stop()
      .then(() => callback(error))
      .catch(callback)
  }

  _read (size) {
    this.#sendBufferedMessages()

    this.#allowPush = this.#messages.length === 0
  }

  get address () {
    return this.#socket.address().address
  }

  get port () {
    return this.#socket.address().port
  }

  /**
   * @param {*} message
   */
  #addMessage (message) {
    if (this.#allowPush) {
      this.#allowPush = this.push(message)
    } else {
      this.#messages.push(message)
    }
  }

  #sendBufferedMessages () {
    if (this.#messages.length === 0) return

    for (let i = 0; i < this.#messages.length; ++i) {
      if (!this.push(this.#messages[i])) {
        this.#messages.splice(0, i + 1)
        break
      }
    }
  }

  async #start () {
    await this.#initSocket()
    this.#attachHandlers()

    this.#address = this.#socket.address().address
    this.#port = this.#socket.address().port

    this.emit('ready')
  }

  async #stop () {
    if (!this.#socket) return

    this.#detachHandlers()
    this.#socket.close()

    await EventEmitter.once(this.#socket, 'close')
  }

  async #initSocket () {
    this.#socket = dgram.createSocket({ type: this.#type })
    this.#socket.bind(this.#port, this.#host)

    const error = await Promise.race([
      EventEmitter.once(this.#socket, 'listening'),
      EventEmitter.once(this.#socket, 'error')
    ])

    if (error instanceof Error) {
      this.destroy(error)
    }
  }

  #attachHandlers () {
    this.#socket.on('error', this.#handleSocketError)
    this.#socket.on('message', this.#handleSocketMessage)
  }

  #detachHandlers () {
    this.#socket.off('error', this.#handleSocketError)
    this.#socket.off('message', this.#handleSocketMessage)
  }

  /**
   * @param {Buffer|any} body any in ObjectMode, otherwise should be Buffer
   * @param {MessageHead} head
   */
  handleMessage (body, head) {
    if (this.#headless) {
      return this.#addMessage(body)
    }

    if (this.#objectMode) {
      head.body = body

      return this.#addMessage(head)
    } else {
      return this.#addMessage(
        Buffer.concat([UDPSocket.serializeHead(head), body])
      )
    }
  }

  /**
   * @param {MessageHead} head
   * @returns {Buffer}
   */
  static serializeHead (head) {
    const buffer = Buffer.alloc(5 + (head.address?.length || 0))

    buffer.writeUintBE(head.size, 0, 2)
    buffer[2] = head.family === 'IPv4' ? 0x04 : 0x06
    buffer.writeUintBE(head.port, 3, 2)
    buffer.set(Buffer.from(head.address, 'utf8'), 5)

    return buffer
  }

  /**
   * Usable when headless=true and objectMode=false
   * @param {Buffer} payload
   * @returns {MessageHead}
   */
  static deserializeHead (payload) {
    const size = payload.readUintBE(0, 2)

    return {
      size,
      family: payload[2] === 0x06 ? 'IPv6' : 'IPv4',
      port: payload.readUintBE(3, 2),
      address: payload.subarray(5, payload.length - size).toString('utf8'),
      body: payload.subarray(payload.length - size)
    }
  }
}

export default UDPSocket
