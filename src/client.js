import dgram from 'node:dgram'
import { EventEmitter, once } from 'node:events'

/**
 * @typedef {object} UDPClientOptions
 * @property {string} [type='udp4']
 * @property {number} [port=44002]
 * @property {string} [host=('127.0.0.1'|'::1')]
 */

/**
 * @param {UDPClientOptions} [options={}]
 * @constructor
 */
class UDPClient extends EventEmitter {
  /** @type {number} */
  #port

  /** @type {string} */
  #host

  /** @type {'udp4'|'udp6'} */
  #type

  /** @type {Promise<any>} */
  #connecting

  /** @type {dgram.Socket} */
  #socket

  /**
   * @param {UDPClientOptions} [options]
   */
  constructor ({
    type = 'udp4',
    port = 44002,
    host = type === 'udp4' ? '127.0.0.1' : '::1',
    ...eventEmitterOptions
  } = {}) {
    super(eventEmitterOptions)

    this.#port = port
    this.#host = host
    this.#type = type

    this.#socket = dgram.createSocket(this.#type)
    this.#connecting = once(this.#socket, 'connect')

    this.#socket.connect(this.#port, this.#host, () => {
      this.emit('ready')
    })
  }

  /**
   * @param {Buffer} buffer
   */
  send (buffer) {
    this.#socket.send(buffer)
  }
}

export default UDPClient
