import type {ChaosMode} from '@frogpond/launch-arguments'

import {isBlockedUrl} from './blocked'
import {corruptBody, faultStatus, pickFault, type Fault} from './faults'
import {reportFinding} from './findings'
import type {LineFile} from './line-file'
import type {Random} from './random'
import {readTape, RequestCounter, requestKey, type TapeEntry} from './tape'

/** How the chaos fetch behaves for one launch. */
export type ChaosFetchOptions = {
	mode: ChaosMode
	launch: number
	random: Random
	faultRate: number
	tape: LineFile
	sleep?: (ms: number) => Promise<void>
}

const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))

function abortError(): Error {
	return Object.assign(new Error('Aborted'), {name: 'AbortError'})
}

/** React Native's own message for a request that never got an answer. */
function networkError(): TypeError {
	return new TypeError('Network request failed')
}

function isAbort(error: unknown): boolean {
	return error instanceof Error && error.name === 'AbortError'
}

/** Fetches for real, applies `fault`, and returns what the app will get. */
async function answer(
	realFetch: typeof fetch,
	request: Request,
	key: string,
	fault: Fault,
): Promise<TapeEntry> {
	let base = {key, headers: [] as Array<[string, string]>, body: '', status: 0, fault: fault.kind}
	let delayMs = fault.kind === 'latency' ? fault.delayMs : 0
	if (fault.kind === 'network') {
		return {...base, delayMs, error: 'network'}
	}
	try {
		let response = await realFetch(request)
		let body = await response.text()
		return {
			...base,
			status: faultStatus(fault, response.status),
			headers: [...response.headers.entries()],
			body: corruptBody(fault, body),
			delayMs,
			error: null,
		}
	} catch (error) {
		return {...base, delayMs, error: isAbort(error) ? 'abort' : 'network'}
	}
}

/** Turns a tape entry back into what `fetch` would have done. */
async function deliver(entry: TapeEntry, sleep: (ms: number) => Promise<void>): Promise<Response> {
	if (entry.delayMs > 0) {
		await sleep(entry.delayMs)
	}
	if (entry.error === 'abort') {
		throw abortError()
	}
	if (entry.error === 'network') {
		throw networkError()
	}
	return new Response(entry.body, {status: entry.status, headers: entry.headers})
}

/**
 * `fetch`, with faults injected and every answer recorded, or with answers
 * served from an earlier run's recording.
 */
export function chaosFetch(realFetch: typeof fetch, options: ChaosFetchOptions): typeof fetch {
	let counter = new RequestCounter()
	let sleep = options.sleep ?? wait
	let recorded = options.mode === 'replay' ? readTape(options.tape) : null

	return async (input, init) => {
		// `fetch` accepts a URL where `Request`'s constructor does not.
		let request = new Request(input instanceof URL ? input.toString() : input, init)
		let key = requestKey(
			options.launch,
			request.method,
			request.url,
			counter.next(request.method, request.url),
		)

		if (isBlockedUrl(request.url)) {
			throw networkError()
		}

		if (recorded) {
			let entry = recorded.get(key)
			if (!entry) {
				reportFinding('divergence', `no recorded answer for ${key}`)
				throw networkError()
			}
			return deliver(entry, sleep)
		}

		let entry = await answer(realFetch, request, key, pickFault(options.random, options.faultRate))
		options.tape.append(JSON.stringify(entry))
		return deliver(entry, sleep)
	}
}
