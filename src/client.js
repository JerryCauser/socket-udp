import dgram from 'node:dgram'
import { Writable } from 'node:stream'
import EventEmitter from 'node:events'

/**
 * @param {UDPClientOptions} [options]
 * @constructor
 */
class UDPClient extends Writable {
  /** @type {'udp4'|'udp6'} */
  #type

  /** @type {number} */
  #targetPort

  /** @type {string} */
  #targetAddress

  /** @type {dgram.BindOptions} */
  #bindOptions

  /** @type {dgram.Socket} */
  #socket

  /** @type {boolean} */
  #allowWrite = true

  /** @type {function} */
  #drainHandler = () => {
    this.#allowWrite = true
  }

  /**
   * @param {UDPClientOptions} [options]
   */
  constructor (options) {
    const {
      type = 'udp4',
      port: targetPort = 44002,
      address: targetAddress = type === 'udp4' ? '127.0.0.1' : '::1',
      objectMode = true,
      bindOptions,
      reuseAddr,
      ipv6Only,
      recvBufferSize,
      sendBufferSize,
      lookup,
      signal,
      ...readableOptions
    } = options ?? {}

    super({ ...readableOptions, objectMode })

    this.#type = type
    this.#targetPort = Number(targetPort).valueOf()
    this.#targetAddress = targetAddress
    this.#bindOptions = bindOptions ?? {}
    this.#socket = dgram.createSocket({
      type,
      reuseAddr,
      ipv6Only,
      recvBufferSize,
      sendBufferSize,
      lookup,
      signal
    })
  }

  _construct (callback) {
    this.on('drain', this.#drainHandler)
    this.#start()
      .then(() => callback(null))
      .catch(callback)
  }

  _write (chunk, encoding, callback) {
    this.#send(chunk, callback)
  }

  _destroy (error, callback) {
    this.off('drain', this.#drainHandler)
    if (error) {
      this.emit('error', error)
    }

    this.#stop()
      .then(() => callback(error))
      .catch(callback)
  }

  async #start () {
    if (this.#bindOptions !== undefined) {
      this.#socket.bind(this.#bindOptions)
    }
    this.#socket.connect(this.#targetPort, this.#targetAddress)

    const error = await Promise.race([
      Promise.all([
        EventEmitter.once(this.#socket, 'connect'),
        EventEmitter.once(this.#socket, 'listening')
      ]),
      EventEmitter.once(this.#socket, 'error')
    ])

    if (error instanceof Error) {
      this.destroy(error)
    }

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
    return this.#socket.address().address
  }

  get port () {
    return this.#socket.address().port
  }

  get family () {
    return this.#socket.address().family
  }

  get allowWrite () {
    return this.#allowWrite
  }

  get targetPort () {
    return this.#targetPort
  }

  get targetAddress () {
    return this.#targetAddress
  }

  write (chunk, callback) {
    this.#allowWrite = super.write(chunk, callback)

    return this.#allowWrite
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

/** @type {UDPClient} */
export default UDPClient
