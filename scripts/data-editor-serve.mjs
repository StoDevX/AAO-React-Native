import {createReadStream} from 'node:fs'
import {stat} from 'node:fs/promises'
import {createServer} from 'node:http'
import path from 'node:path'

/** The types of what `bundle-data` writes. */
const TYPES = {
	'.json': 'application/json',
	'.webp': 'image/webp',
	'.css': 'text/css',
	'.geojson': 'application/geo+json',
}

/**
 * Serves the files under `root` to the phone and to the local Worker. `root`
 * is read on every request, so a build swapped in is served at once.
 */
export function serve({root, port, host = '::'}) {
	let base = path.resolve(root)
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
		let file = path.join(base, pathname)
		let info = file.startsWith(base + path.sep)
			? await stat(file).catch(() => undefined)
			: undefined
		if (!info?.isFile()) {
			response.writeHead(404, {'Cache-Control': 'no-store'}).end()
			return
		}
		response.writeHead(200, {
			'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream',
			'Content-Length': info.size,
			'Cache-Control': 'no-store',
		})
		if (request.method === 'HEAD') {
			response.end()
			return
		}
		createReadStream(file).pipe(response)
	})
	return new Promise((resolve, reject) => {
		server.once('error', reject)
		server.listen(port, host, () => {
			server.off('error', reject)
			resolve(server)
		})
	})
}
