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
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// index.js
var udp_socket_exports = {};
__export(udp_socket_exports, {
  DEFAULT_PORT: () => DEFAULT_PORT,
  UDPClient: () => client_default,
  UDPSocket: () => socket_default
});
module.exports = __toCommonJS(udp_socket_exports);

// src/socket.js
var import_node_events = __toESM(require("node:events"), 1);
var import_node_dgram = __toESM(require("node:dgram"), 1);
var import_node_buffer = require("node:buffer");
var import_node_stream = require("node:stream");

// src/constants.js
var DEFAULT_PORT = 44002;

// src/socket.js
var UDPSocket = class extends import_node_stream.Readable {
  #host;
  #port;
  #address;
  #type;
  #socket;
  #objectMode = false;
  #headless = true;
  #allowPush = true;
  #messages = [];
  #handleSocketMessage;
  #handleSocketError = (error) => {
    this.destroy(error);
  };
  constructor({
    type = "udp4",
    port = DEFAULT_PORT,
    host = type === "udp4" ? "127.0.0.1" : "::1",
    decryption,
    headless = true,
    objectMode = false,
    ...readableOptions
  } = {}) {
    super({ ...readableOptions, objectMode });
    this.#port = port;
    this.#host = host;
    this.#type = type;
    this.#headless = headless;
    this.#objectMode = objectMode;
    this.#handleSocketMessage = (data, head) => this.handleMessage(data, head);
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
    this.#sendBufferedMessages();
    this.#allowPush = this.#messages.length === 0;
  }
  get address() {
    return this.#socket.address().address;
  }
  get port() {
    return this.#socket.address().port;
  }
  #addMessage(message) {
    if (this.#allowPush) {
      this.#allowPush = this.push(message);
    } else {
      this.#messages.push(message);
    }
  }
  #sendBufferedMessages() {
    if (this.#messages.length === 0)
      return;
    for (let i = 0; i < this.#messages.length; ++i) {
      if (!this.push(this.#messages[i])) {
        this.#messages.splice(0, i + 1);
        break;
      }
    }
  }
  async #start() {
    await this.#initSocket();
    this.#attachHandlers();
    this.#address = this.#socket.address().address;
    this.#port = this.#socket.address().port;
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
    this.#socket = import_node_dgram.default.createSocket({ type: this.#type });
    this.#socket.bind(this.#port, this.#host);
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
  handleMessage(body, head) {
    if (this.#headless) {
      return this.#addMessage(body);
    }
    if (this.#objectMode) {
      head.body = body;
      return this.#addMessage(head);
    } else {
      return this.#addMessage(
        import_node_buffer.Buffer.concat([UDPSocket.serializeHead(head), body])
      );
    }
  }
  static serializeHead(head) {
    var _a;
    const buffer = import_node_buffer.Buffer.alloc(5 + (((_a = head.address) == null ? void 0 : _a.length) || 0));
    buffer.writeUintBE(head.size, 0, 2);
    buffer[2] = head.family === "IPv4" ? 4 : 6;
    buffer.writeUintBE(head.port, 3, 2);
    buffer.set(import_node_buffer.Buffer.from(head.address, "utf8"), 5);
    return buffer;
  }
  static deserializeHead(payload) {
    const size = payload.readUintBE(0, 2);
    return {
      size,
      family: payload[2] === 6 ? "IPv6" : "IPv4",
      port: payload.readUintBE(3, 2),
      address: payload.subarray(5, payload.length - size).toString("utf8"),
      body: payload.subarray(payload.length - size)
    };
  }
};
var socket_default = UDPSocket;

// src/client.js
var import_node_dgram2 = __toESM(require("node:dgram"), 1);
var import_node_events2 = require("node:events");
var Client = class extends import_node_events2.EventEmitter {
  #port;
  #host;
  #type;
  #connecting;
  #socket;
  constructor({
    type = "udp4",
    port = 44002,
    host = type === "udp4" ? "127.0.0.1" : "::1",
    ...eventEmitterOptions
  } = {}) {
    super(eventEmitterOptions);
    this.#port = port;
    this.#host = host;
    this.#type = type;
    this.#socket = import_node_dgram2.default.createSocket(this.#type);
    this.#connecting = (0, import_node_events2.once)(this.#socket, "connect");
    this.#socket.connect(this.#port, this.#host, () => {
      this.emit("ready");
    });
  }
  send(buffer) {
    this.#socket.send(buffer);
  }
};
var client_default = Client;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  DEFAULT_PORT,
  UDPClient,
  UDPSocket
});
