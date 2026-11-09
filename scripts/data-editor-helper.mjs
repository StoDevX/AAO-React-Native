#!/usr/bin/env node
// The Mac data editor's pipeline helper: one JSON request per line on stdin,
// one reply per line on stdout, handled in order. See
// documentation/plans/2026-11-05-mac-data-editor.md for the protocol.

import path from 'node:path'
import {createInterface} from 'node:readline'
import {parseArgs} from 'node:util'
import {DocumentStore} from './data-editor-documents.mjs'
import {build, listBuildings, pruneBuilds, readCalendar, validate} from './data-editor-pipeline.ts'
import {serve} from './data-editor-serve.mjs'

/** The protocol's methods over one data directory and its build folder. */
export function createHandlers({dataDir, outDir, bundleData}) {
	let store = new DocumentStore(dataDir)
	let server
	/** The folder of the newest good build, which the server serves. */
	let current
	return {
		list: () => listBuildings(dataDir),
		calendar: () => readCalendar(dataDir),
		load: async ({file}) => ({value: await store.load(file), problems: validate(dataDir, file)}),
		edit: async ({file, ops}) => ({
			value: await store.edit(file, ops),
			problems: validate(dataDir, file),
		}),
		// The new build is served from the moment it is whole; older ones go after.
		build: async () => {
			let result = await build({bundleData, dataDir, outDir})
			if (!result.ok) return result
			current = result.dir
			await pruneBuilds(outDir, current)
			return {ok: true}
		},
		serve: async ({port}) => {
			server ??= await serve({root: () => current, port})
			return {port: server.address().port}
		},
		close: () => server?.close(),
	}
}

/** The reply to one request line. */
export async function handle(handlers, line) {
	let request
	try {
		request = JSON.parse(line)
	} catch {
		return {id: null, error: {message: 'not JSON'}}
	}
	let method = request?.method
	let handler =
		typeof method === 'string' && method !== 'close' && Object.hasOwn(handlers, method)
			? handlers[method]
			: undefined
	if (!handler) return {id: request?.id ?? null, error: {message: `no method ${String(method)}`}}
	try {
		return {id: request.id, result: (await handler(request.params ?? {})) ?? null}
	} catch (error) {
		return {
			id: request.id,
			error: {message: error instanceof Error ? error.message : String(error)},
		}
	}
}

/** Reads requests from stdin until it closes. `args` are the command line's. */
export function main(args = process.argv.slice(2)) {
	let {values} = parseArgs({
		args,
		options: {
			data: {type: 'string'},
			out: {type: 'string'},
			'bundle-data': {type: 'string', default: path.join(import.meta.dirname, 'bundle-data.mjs')},
		},
	})
	if (!values.data || !values.out) {
		console.error('usage: data-editor-helper.mjs --data <dir> --out <dir> [--bundle-data <file>]')
		process.exit(1)
	}
	let handlers = createHandlers({
		dataDir: path.resolve(values.data),
		outDir: path.resolve(values.out),
		bundleData: values['bundle-data'],
	})
	let queue = Promise.resolve()
	let lines = createInterface({input: process.stdin})
	lines.on('line', (line) => {
		queue = queue.then(async () => {
			process.stdout.write(`${JSON.stringify(await handle(handlers, line))}\n`)
		})
	})
	// the app closing stdin is the one way to stop
	lines.on('close', () => {
		void queue.then(() => {
			handlers.close()
			process.exit(0)
		})
	})
}

if (import.meta.main) main()
