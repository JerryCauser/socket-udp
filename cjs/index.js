var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.js
var socket_udp_exports = {};
__export(socket_udp_exports, {
  DEFAULT_PORT: () => DEFAULT_PORT,
  UDPClient: () => client_default,
  UDPSocket: () => socket_default
});
module.exports = __toCommonJS(socket_udp_exports);

// src/socket.js
var import_node_events = __toESM(require("node:events"), 1);
var import_node_dgram = __toESM(require("node:dgram"), 1);
var import_node_stream = require("node:stream");

// src/constants.js
var DEFAULT_PORT = 44002;

// src/socket.js
var UDPSocket = class extends import_node_stream.Readable {
  /** @type {number} */
  #port;
  /** @type {string} */
  #address;
  /** @type {'udp4'|'udp6'} */
  #type;
  /** @type {dgram.Socket} */
  #socket;
  /** @type {boolean} */
  #allowPush = false;
  /** @type {boolean} */
  #pushMeta = false;
  /** @type {(data:Buffer, head:MessageHead) => boolean} */
  #handleSocketMessage = (data, head) => this.handleMessage(data, head);
  /** @type {(object:Error) => this} */
  #handleSocketError = (error) => this.destroy(error);
  /**
   * @param {UDPSocketOptions} [options]
   */
  constructor(options) {
    const {
      type = "udp4",
      address = type === "udp4" ? "127.0.0.1" : "::1",
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
    } = options ?? {};
    super({ ...readableOptions, signal, objectMode });
    this.#type = type;
    this.#address = address;
    this.#port = port;
    this.#pushMeta = pushMeta === true;
    this.#socket = import_node_dgram.default.createSocket({
      type,
      reuseAddr,
      ipv6Only,
      recvBufferSize,
      sendBufferSize,
      lookup,
      signal
    });
  }
  _construct(callback) {
    this.#start().then(() => callback(null)).catch(callback);
  }
  _destroy(error, callback) {
    if (error) {
      this.emit("error", error);
    }
    this.#stop().then(() => callback(error)).catch(callback);
  }
  _read(size) {
    this.#allowPush = true;
  }
  get origin() {
    return this.#socket;
  }
  get address() {
    return this.origin.address().address;
  }
  get port() {
    return this.origin.address().port;
  }
  get family() {
    return this.origin.address().family;
  }
  get allowPush() {
    return this.#allowPush;
  }
  get pushMetaMode() {
    return this.#pushMeta;
  }
  async #start() {
    await this.#initSocket();
    this.#attachHandlers();
    this.emit("ready");
  }
  async #stop() {
    if (!this.#socket)
      return;
    this.#detachHandlers();
    this.#socket.close();
    await import_node_events.default.once(this.#socket, "close");
  }
  async #initSocket() {
    this.#socket.bind(this.#port, this.#address);
    const error = await Promise.race([
      import_node_events.default.once(this.#socket, "listening"),
      import_node_events.default.once(this.#socket, "error")
    ]);
    if (error instanceof Error) {
      this.destroy(error);
    }
  }
  #attachHandlers() {
    this.#socket.on("error", this.#handleSocketError);
    this.#socket.on("message", this.#handleSocketMessage);
  }
  #detachHandlers() {
    this.#socket.off("error", this.#handleSocketError);
    this.#socket.off("message", this.#handleSocketMessage);
  }
  /**
   * @param {Buffer|any} body any in ObjectMode, otherwise should be Buffer
   * @param {MessageHead} [head]
   * @returns {boolean} allowPush
   */
  handleMessage(body, head) {
    if (this.#allowPush) {
      if (this.#pushMeta) {
        head.body = body;
        this.#allowPush = this.push(head);
      } else {
        this.#allowPush = this.push(body);
      }
    }
    return this.#allowPush;
  }
};
var socket_default = UDPSocket;

// src/client.js
var import_node_dgram2 = __toESM(require("node:dgram"), 1);
var import_node_stream2 = require("node:stream");
var import_node_events2 = __toESM(require("node:events"), 1);
var UDPClient = class extends import_node_stream2.Writable {
  /** @type {'udp4'|'udp6'} */
  #type;
  /** @type {number} */
  #targetPort;
  /** @type {string} */
  #targetAddress;
  /** @type {dgram.BindOptions} */
  #bindOptions;
  /** @type {dgram.Socket} */
  #socket;
  /** @type {boolean} */
  #allowWrite = true;
  /** @type {function} */
  #drainHandler = () => {
    this.#allowWrite = true;
  };
  /**
   * @param {UDPClientOptions} [options]
   */
  constructor(options) {
    const {
      type = "udp4",
      port: targetPort = 44002,
      address: targetAddress = type === "udp4" ? "127.0.0.1" : "::1",
      objectMode = true,
      bindOptions,
      reuseAddr,
      ipv6Only,
      recvBufferSize,
      sendBufferSize,
      lookup,
      signal,
      ...readableOptions
    } = options ?? {};
    super({ ...readableOptions, objectMode });
    this.#type = type;
    this.#targetPort = Number(targetPort).valueOf();
    this.#targetAddress = targetAddress;
    this.#bindOptions = bindOptions ?? {};
    this.#socket = import_node_dgram2.default.createSocket({
      type,
      reuseAddr,
      ipv6Only,
      recvBufferSize,
      sendBufferSize,
      lookup,
      signal
    });
  }
  _construct(callback) {
    this.on("drain", this.#drainHandler);
    this.#start().then(() => callback(null)).catch(callback);
  }
  _write(chunk, encoding, callback) {
    this.#send(chunk, callback);
  }
  _destroy(error, callback) {
    this.off("drain", this.#drainHandler);
    if (error) {
      this.emit("error", error);
    }
    this.#stop().then(() => callback(error)).catch(callback);
  }
  async #start() {
    if (this.#bindOptions !== void 0) {
      this.#socket.bind(this.#bindOptions);
    }
    this.#socket.connect(this.#targetPort, this.#targetAddress);
    const error = await Promise.race([
      Promise.all([
        import_node_events2.default.once(this.#socket, "connect"),
        import_node_events2.default.once(this.#socket, "listening")
      ]),
      import_node_events2.default.once(this.#socket, "error")
    ]);
    if (error instanceof Error) {
      this.destroy(error);
    }
    this.emit("ready");
  }
  async #stop() {
    if (!this.#socket)
      return;
    this.#socket.close();
    await import_node_events2.default.once(this.#socket, "close");
  }
  get origin() {
    return this.#socket;
  }
  get address() {
    return this.#socket.address().address;
  }
  get port() {
    return this.#socket.address().port;
  }
  get family() {
    return this.#socket.address().family;
  }
  get allowWrite() {
    return this.#allowWrite;
  }
  get targetPort() {
    return this.#targetPort;
  }
  get targetAddress() {
    return this.#targetAddress;
  }
  write(chunk, callback) {
    this.#allowWrite = super.write(chunk, callback);
    return this.#allowWrite;
  }
  /**
   *
   * @param {Buffer} buffer
   * @param {function} callback
   */
  #send(buffer, callback) {
    this.#socket.send(buffer, callback);
  }
};
var client_default = UDPClient;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_PORT,
  UDPClient,
  UDPSocket
});
