/// <reference types="node" />
import type { Buffer } from 'node:buffer'
import type { Readable, Writable, ReadableOptions, WritableOptions} from 'node:stream'
import type * as dgram from  'node:dgram'

export const DEFAULT_PORT: number

export interface MessageHead extends dgram.RemoteInfo {
    body?: Buffer
}

export type UDPSocketOptions = ReadableOptions & dgram.SocketOptions & {
    type?: dgram.SocketType
    port?: number
    address?: string,
    pushMeta?: boolean
} | undefined

export class UDPSocket extends Readable {
    constructor (options?: UDPSocketOptions)
    push (chunk: Buffer | MessageHead | any, encoding: BufferEncoding): boolean
    get origin (): dgram.Socket
    get address (): string
    get port (): number
    get family (): string
    get allowPush (): boolean
    get pushMetaMode (): boolean
    handleMessage (body: Buffer | any, head?: MessageHead | undefined): boolean
}

export type UDPClientOptions = WritableOptions & dgram.SocketOptions & {
    type?: dgram.SocketType
    port?: number
    address?: string,
    bindOptions?: dgram.BindOptions
} | undefined

export class UDPClient extends Writable {
    constructor (options?: UDPClientOptions)
    get origin (): dgram.Socket
    get address (): string
    get port (): number
    get family (): string
    get allowWrite (): boolean
    get targetAddress (): string
    get targetPort (): number
}
