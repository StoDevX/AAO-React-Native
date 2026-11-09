import {open} from 'node:fs/promises'
import {createServer} from 'node:http'
import path from 'node:path'

/** The types of what `bundle-data` writes. */
const TYPES = {
	'.json': 'application/json',
	'.webp': 'image/webp',
	'.css': 'text/css',
	'.geojson': 'application/geo+json',
}

/** The file under `root` that `pathname` names, or undefined if it would leave `root`. */
function fileIn(root, pathname) {
	let base = path.resolve(root)
	let file = path.join(base, pathname)
	return file.startsWith(base + path.sep) ? file : undefined
}

/**
 * Serves the files under `root` to the phone and to the local Worker. `root`
 * is a folder, or a function returning the current build's folder (undefined
 * before the first), read on every request. Each file is opened before its
 * size is read, so a build removed mid-request still serves what was opened.
 */
export function serve({root, port, host = '::'}) {
	let server = createServer(async (request, response) => {
		if (request.method !== 'GET' && request.method !== 'HEAD') {
			response.writeHead(405, {Allow: 'GET, HEAD'}).end()
			return
		}
		let pathname
		try {
			pathname = decodeURIComponent(new URL(request.url ?? '/', 'http://localhost').pathname)
		} catch {
			response.writeHead(400).end()
			return
		}
		let current = typeof root === 'function' ? root() : root
		let file = current === undefined ? undefined : fileIn(current, pathname)
		let handle = file === undefined ? undefined : await open(file).catch(() => undefined)
		let info = handle ? await handle.stat().catch(() => undefined) : undefined
		if (!handle || !info?.isFile()) {
			await handle?.close()
			response.writeHead(404, {'Cache-Control': 'no-store'}).end()
			return
		}
		response.writeHead(200, {
			'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream',
			'Content-Length': info.size,
			'Cache-Control': 'no-store',
		})
		if (request.method === 'HEAD') {
			await handle.close()
			response.end()
			return
		}
		let stream = handle.createReadStream()
		stream.on('error', () => response.destroy())
		stream.pipe(response)
	})
	return new Promise((resolve, reject) => {
		server.once('error', reject)
		server.listen(port, host, () => {
			server.off('error', reject)
			resolve(server)
		})
	})
}
