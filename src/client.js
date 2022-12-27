import dgram from 'node:dgram'
import { Writable } from 'node:stream'
import EventEmitter from 'node:events'

/**
 * @param {UDPClientOptions} [options={}]
 * @constructor
 */
class UDPClient extends Writable {
  /** @type {number} */
  #port

  /** @type {string} */
  #address

  /** @type {'udp4'|'udp6'} */
  #type

  /** @type {dgram.Socket} */
  #socket

  /**
   * @param {UDPClientOptions} [options]
   */
  constructor (options) {
    const {
      type = 'udp4',
      port = 44002,
      address = type === 'udp4' ? '127.0.0.1' : '::1',
      objectMode = true,
      ...readableOptions
    } = options ?? {}

    super({ ...readableOptions, objectMode })

    this.#port = port
    this.#address = address
    this.#type = type
  }

  _construct (callback) {
    this.#start()
      .then(() => callback(null))
      .catch(callback)
  }

  _write (chunk, encoding, callback) {
    this.#send(chunk, callback)
  }

  _destroy (error, callback) {
    if (error) {
      this.emit('error', error)
    }

    this.#stop()
      .then(() => callback(error))
      .catch(callback)
  }

  async #start () {
    this.#socket = dgram.createSocket(this.#type)
    this.#socket.connect(this.#port, this.#address)

    await EventEmitter.once(this.#socket, 'connect')

    this.emit('ready')
  }

  async #stop () {
    if (!this.#socket) return

    this.#socket.close()

    await EventEmitter.once(this.#socket, 'close')
  }

  get origin () {
    return this.#socket
  }

  get address () {
    return this.origin.address().address
  }

  get port () {
    return this.origin.address().port
  }

  get family () {
    return this.origin.address().family
  }

  /**
   *
   * @param {Buffer} buffer
   * @param {function} callback
   */
  #send (buffer, callback) {
    this.#socket.send(buffer, callback)
  }
}

export default UDPClient
