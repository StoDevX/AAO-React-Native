#!/usr/bin/env node
// The Mac data editor's pipeline helper: one JSON request per line on stdin,
// one reply per line on stdout, handled in order. `createHandlers` holds
// the protocol's methods, and `handle` the shape of a request and reply.

import path from 'node:path'
import {createInterface} from 'node:readline'
import {parseArgs} from 'node:util'
import {parse} from 'yaml'
import {listRecords, loadCatalog, recordSchema} from './data-editor-datasets.mjs'
import {DocumentStore} from './data-editor-documents.mjs'
import {createRecord, removeRecord, reorderRecords} from './data-editor-records.mjs'
import {build, listBuildings, pruneBuilds, readCalendar, validate} from './data-editor-pipeline.ts'
import {serve} from './data-editor-serve.mjs'

/**
 * The version of the handlers' parameters and replies. The Mac app holds the
 * one it speaks (`HelperRuntime.protocolVersion`) and refuses a helper with
 * another. Changing a handler's parameters or its reply's shape bumps both.
 */
export const PROTOCOL = 3

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
		// The new build is served from the moment it is whole; older ones go
		// after. `serving` is the build the Mac app serves, which stays: the
		// app moves its server to the new one only once this reply reaches it.
		build: async ({serving}) => {
			let result = await build({bundleData, dataDir, outDir})
			if (!result.ok) return result
			current = result.dir
			await pruneBuilds(outDir, current, serving)
			// the folder to serve, which the app's own server reads
			return {ok: true, dir: current}
		},
		serve: async ({port}) => {
			server ??= await serve({root: () => current, port})
			return {port: server.address().port}
		},
		close: () => server?.close(),
		// a file's base version, which the app holds as text, to compare with the file now
		parse: ({text}) => parse(text),
		datasets: () => loadCatalog(dataDir),
		records: ({set}) => ({records: listRecords(dataDir, loadCatalog(dataDir), set), problems: []}),
		schema: ({set}) => recordSchema(dataDir, loadCatalog(dataDir), set),
		create: ({set, title, section}) => createRecord(dataDir, set, {title, section}),
		remove: ({set, file, path: recordPath}) => removeRecord(dataDir, set, {file, path: recordPath}),
		reorder: ({set, order}) => reorderRecords(dataDir, set, order),
		// every changed file's problems, so Submit waits for a record the contributor has left
		check: ({files}) => files.flatMap((file) => validate(dataDir, file)),
		// a list's items in a new order, moved as nodes so their comments go with them
		move: async ({file, path: listPath, order}) => {
			await store.reorderList(file, listPath, order)
			return {value: await store.load(file), problems: validate(dataDir, file)}
		},
		readText: ({file}) => store.readText(file),
		writeText: async ({file, text, expected}) => {
			await store.writeText(file, text, expected)
		},
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

/**
 * Runs each step after the one before. A step that throws is passed to
 * `onError` and the next step still runs, so one bad reply never stops the rest.
 */
export function inOrder(onError) {
	let tail = Promise.resolve()
	return (step) => {
		tail = tail.then(step).catch(onError)
		return tail
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
	let run = inOrder((error) => console.error(error))
	let lines = createInterface({input: process.stdin})
	lines.on('line', (line) => {
		void run(async () => {
			process.stdout.write(`${JSON.stringify(await handle(handlers, line))}\n`)
		})
	})
	// the app closing stdin is the one way to stop
	lines.on('close', () => {
		void run(() => {
			handlers.close()
			process.exit(0)
		})
	})
}

if (import.meta.main) main()
