import crypto from 'node:crypto'
import assert from 'node:assert'
import dgram from 'node:dgram'
import { once } from 'node:events'
import { tryCountErrorHook } from './_main.js'

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

/**
 * @param {number} port
 * @returns {Promise<Socket & {messages:Buffer[], stop: (() => Promise<void>)}>}
 */
const createUDPSocket = async (port) => {
  const socket = Object.create(
    dgram.createSocket({ type: 'udp4', reuseAddr: true })
  )
  socket.bind(port, '127.0.0.1')

  const error = await Promise.race([
    once(socket, 'listening'),
    once(socket, 'error')
  ])

  socket.messages = []

  socket.on('message', (buffer) => {
    socket.messages.push(buffer)
  })

  if (error instanceof Error) throw Error

  socket.stop = async () => {
    socket.removeAllListeners()
    socket.close()
    await once(socket, 'close')
  }

  return socket
}

async function clientTest (UDPClient) {
  const alias = ' client.js:'

  async function testClient () {
    const caseAlias = `${alias} client sending small message ->`
    const socket = await createUDPSocket(45002)
    const client = new UDPClient({ port: 45002 })
    const payload = crypto.randomBytes(300)

    await once(client, 'ready')

    client.send(payload)

    await delay(5)

    assert.strictEqual(
      socket.messages.length,
      1,
      `${caseAlias} 1 message should be received by socket`
    )

    assert.deepStrictEqual(
      socket.messages[0],
      payload,
      `${caseAlias} received message should be the same as sent one`
    )

    const payload2 = crypto.randomBytes(300)

    client.send(payload2)

    await delay(5)

    assert.strictEqual(
      socket.messages.length,
      2,
      `${caseAlias} 2 messages should be received by socket`
    )

    assert.deepStrictEqual(
      socket.messages[1],
      payload2,
      `${caseAlias} second received message should be the same as sent one`
    )

    await socket.stop()

    console.log(`${caseAlias} passed`)
  }

  const errors = tryCountErrorHook()

  await errors.try(testClient)

  if (errors.count === 0) {
    console.log('[client.js] All test for passed\n')
  } else {
    console.log(`[client.js] Has ${errors.count} errors`)
  }

  return errors.count
}

export default clientTest
