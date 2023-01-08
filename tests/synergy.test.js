import assert from 'node:assert'
import crypto from 'node:crypto'
import { once } from 'node:events'
import { Readable, Writable } from 'node:stream'
import { tryCountErrorHook, assertTry, checkResults } from './_main.js'

/**
 * [x] emulate fast writing
 * [x] emulate slow writing
 */

const TIMEOUT_SYMBOL = Symbol('timeout')
const delay = (ms) =>
  new Promise((resolve) => setTimeout(resolve, ms, TIMEOUT_SYMBOL))

/**
 *
 * @param {UDPSocket} UDPSocket
 * @param {UDPClient} UDPClient
 * @returns {Promise<number>}
 */
async function socketTest (UDPSocket, UDPClient) {
  const alias = '  synergy.js: '

  const DEFAULT_PORT = 45007

  const createReader = ({ data, fast }) => {
    const reader = new Readable({
      read (size) {
        reader.emit('readyToRead')
      }
    })

    reader.readyToRead = false

    const interval = fast
      ? Math.min(508, data.length / 300)
      : Math.min(508, data.length / 30)

    reader.startReading = async () => {
      for (let i = 0; i < data.length; i += interval) {
        if (reader.push(data.subarray(i, i + interval))) {
          await once(reader, 'readyToRead')
        }

        if (!fast) await delay(5)
      }

      await delay(50)
    }

    return reader
  }

  const createWriter = () => {
    const writer = new Writable({
      write (chunk, encoding, callback) {
        writer.result.push(chunk)
        callback()
      }
    })

    writer.result = []

    return writer
  }

  function checkOnlyMessage ({ caseAlias, message, results, payload }) {
    assertTry(
      () =>
        assert.deepStrictEqual(
          message,
          payload,
          `${caseAlias} received message should be the same as sent one`
        ),
      results
    )

    console.log({ message: message.length, payload: payload.length })
  }

  async function testSynergy (port, fast, payloadSize) {
    const caseAlias = `${alias} sending messages fast=${fast ? 1 : 0}, payloadSize=${payloadSize} ->`
    const results = { fails: [] }

    const writer = createWriter()
    const client = new UDPClient({ port })
    const socket = new UDPSocket({ port })

    socket.pipe(writer)

    const payload = crypto.randomBytes(payloadSize)
    const reader = createReader({ data: payload, fast })

    reader.pipe(client)
    await reader.startReading()

    const message = Buffer.concat(writer.result)

    checkOnlyMessage({
      caseAlias,
      message,
      results,
      payload
    })

    socket.destroy()
    client.destroy()

    await Promise.all([once(socket, 'close'), once(client, 'close')])

    checkResults(results, caseAlias)
  }

  const errors = tryCountErrorHook()

  await errors.try(() => testSynergy(DEFAULT_PORT, false, 300))
  await errors.try(() => testSynergy(DEFAULT_PORT, false, 30_000))
  await errors.try(() => testSynergy(DEFAULT_PORT, false, 100_000))
  await errors.try(() => testSynergy(DEFAULT_PORT, true, 300))
  await errors.try(() => testSynergy(DEFAULT_PORT, true, 30_000))
  await errors.try(() => testSynergy(DEFAULT_PORT, true, 100_000))

  if (errors.count === 0) {
    console.log('[synergy.js] All test for passed\n')
  } else {
    console.log(`[synergy.js] Has ${errors.count} errors`)
  }

  return errors.count
}

export default socketTest
