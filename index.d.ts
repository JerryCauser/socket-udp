/// <reference types="node" />
import type { EventEmitter } from 'node:events'
import type { Buffer } from 'node:buffer'
import type { Readable } from 'node:stream'

export const DEFAULT_PORT: 44002

export type MessageHead = {
    address: string
    family: ('IPv4' | 'IPv6')
    port: number
    size: number
    body?: Buffer
}

export type UDPSocketOptions = {
    type?: string
    port?: number
    host?: string
    /**
     * makes this stream to work in object mode with autoparse
     */
    objectMode?: boolean
    /**
     * makes this stream to pass payload without meta info like ipaddress, port, etc.
     * useful when you want to stream video or filedata right into file
     */
    headless?: boolean
}

export class UDPSocket extends Readable {
    static serializeHead (head: MessageHead): Buffer
    static deserializeHead (payload: Buffer): MessageHead

    constructor (options?: UDPSocketOptions)
    get address (): any
    get port (): any
    handleMessage (body: Buffer | any, head: MessageHead): void
}

export type UDPClientOptions = {
    type?: string
    port?: number
    host?: string
}

export class UDPClient extends EventEmitter {
    constructor (options?: UDPClientOptions)
    send (buffer: Buffer): void
}
