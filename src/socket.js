import EventEmitter from 'node:events'
import dgram from 'node:dgram'
import { Readable } from 'node:stream'
import { DEFAULT_PORT } from './constants.js'

class UDPSocket extends Readable {
  /** @type {number} */
  #port

  /** @type {string} */
  #address

  /** @type {'udp4'|'udp6'} */
  #type

  /** @type {dgram.Socket} */
  #socket

  /** @type {boolean} */
  #allowPush = false

  /** @type {boolean} */
  #pushMeta = false

  /** @type {(data:Buffer, head:MessageHead) => boolean} */
  #handleSocketMessage = (data, head) => this.handleMessage(data, head)

  /** @type {(object:Error) => this} */
  #handleSocketError = (error) => this.destroy(error)

  /**
   * @param {UDPSocketOptions} [options]
   */
  constructor (options) {
    const {
      type = 'udp4',
      address = type === 'udp4' ? '127.0.0.1' : '::1',
      port = DEFAULT_PORT,
      objectMode = true,
      pushMeta = false,
      reuseAddr,
      ipv6Only,
      recvBufferSize,
      sendBufferSize,
      lookup,
      signal,
      ...readableOptions
    } = options ?? {}

    super({ ...readableOptions, signal, objectMode })

    this.#type = type
    this.#address = address
    this.#port = port
    this.#pushMeta = pushMeta === true
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
    this.#allowPush = true
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

  get allowPush () {
    return this.#allowPush
  }

  get pushMetaMode () {
    return this.#pushMeta
  }

  async #start () {
    await this.#initSocket()
    this.#attachHandlers()

    this.emit('ready')
  }

  async #stop () {
    if (!this.#socket) return

    this.#detachHandlers()
    this.#socket.close()

    await EventEmitter.once(this.#socket, 'close')
  }

  async #initSocket () {
    this.#socket.bind(this.#port, this.#address)

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
   * @param {MessageHead} [head]
   * @returns {boolean} allowPush
   */
  handleMessage (body, head) {
    if (this.#allowPush) {
      if (this.#pushMeta) {
        head.body = body

        this.#allowPush = this.push(head)
      } else {
        this.#allowPush = this.push(body)
      }
    }

    return this.#allowPush
  }
}

export default UDPSocket
