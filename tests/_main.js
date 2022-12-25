import clientTest from './client.test.js'
import socketTest from './socket.test.js'

/**
 * sequence:
 *  [x] client
 *  [x] socket
 */

export default async function _main (type, { UDPClient, UDPSocket }) {
  console.log(`${type} Tests Started\n`)
  let errorsCount = 0

  errorsCount += await clientTest(UDPClient)
  errorsCount += await socketTest(UDPSocket)

  if (errorsCount === 0) console.log('All tests passed')
  else {
    throw new Error(`Not all tests are passed. FAILED tests: ${errorsCount}`)
  }
}

/**
 * @returns {{count: number, try: (((fn: function) => Promise<void>))}}
 */
export const tryCountErrorHook = () => {
  const tryCountError = async (fn) => {
    try {
      const call = fn()

      if (call?.then) {
        await call
      }
    } catch (e) {
      ++obj.count
      console.error(e)
    }
  }

  const obj = {
    count: 0,
    try: tryCountError
  }

  return obj
}

/**
 * @param {function} fn
 * @param {object} obj
 */
export const assertTry = (fn, obj) => {
  try {
    fn()
  } catch (e) {
    obj.fails.push(e)
  }
}

/**
 * @param {{fails:Error[]|object[]}} results
 * @param {string} caseAlias
 * @param {any?} ctx
 */
export const checkResults = (results, caseAlias, ctx) => {
  if (results.fails.length > 0) {
    const error = new Error(
      `${caseAlias} failed some tests: Number: ${results.fails.length}. Check description`
    )

    if (ctx) error.data = ctx

    Object.assign(error, results)

    throw error
  } else {
    console.log(`${caseAlias} passed`)
  }
}
