/// <reference types="node" />
import type { Buffer } from 'node:buffer'
import type { Readable, Writable, ReadableOptions, WritableOptions} from 'node:stream'
import type * as dgram from  'node:dgram'

export const DEFAULT_PORT: number

export interface MessageHead extends dgram.RemoteInfo {
    body?: Buffer
}

export type UDPSocketOptions = ReadableOptions & {
    type?: dgram.SocketType
    port?: number
    address?: string
} | undefined

export class UDPSocket extends Readable {
    constructor (options?: UDPSocketOptions)
    get origin (): dgram.Socket
    get address (): string
    get port (): number
    get family (): string
    get allowPush (): boolean
    handleMessage (body: Buffer | any, head?: MessageHead | undefined): boolean
}

export type UDPClientOptions = WritableOptions & {
    type?: dgram.SocketType
    port?: number
    address?: string
} | undefined

export class UDPClient extends Writable {
    constructor (options?: UDPClientOptions)
    get origin (): dgram.Socket
    get address (): string
    get port (): number
    get family (): string
}
