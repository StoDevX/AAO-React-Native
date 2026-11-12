// node:http, node:readline and node:buffer for the helper in JavaScriptCore.
// Only the helper's Node command line and server use them, which the Mac app
// replaces with its own.

const unavailable = (name) => () => {
	throw new Error(`${name} has no stand-in in the Mac app`)
}

export const createServer = unavailable('http.createServer')
export const createInterface = unavailable('readline.createInterface')
export const Buffer = {isBuffer: () => false, from: unavailable('Buffer.from')}

export default {createServer, createInterface, Buffer}
