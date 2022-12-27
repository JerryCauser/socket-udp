/// <reference types="node" />
import type { EventEmitter } from 'node:events'
import type { Buffer } from 'node:buffer'
import type { Readable } from 'node:stream'
import type * as dgram from  'node:dgram'

export const DEFAULT_PORT: number

export interface MessageHead extends dgram.RemoteInfo {
    body?: Buffer
}

export type UDPSocketOptions = {
    type?: dgram.SocketType
    port?: number
    host?: string
} | undefined

export class UDPSocket extends Readable {
    constructor (options?: UDPSocketOptions)
    get origin (): dgram.Socket
    get address (): string
    get port (): number
    get allowPush (): boolean
    handleMessage (body: Buffer | any, head?: MessageHead | undefined): boolean
}

export type UDPClientOptions = {
    type?: dgram.SocketType
    port?: number
    host?: string
} | undefined

export class UDPClient extends EventEmitter {
    constructor (options?: UDPClientOptions)
    send (buffer: Buffer): void
}
