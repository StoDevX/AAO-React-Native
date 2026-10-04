import type {ChaosMode, ChaosProfile} from '@frogpond/launch-arguments'

import {isBlockedUrl} from './blocked'
import {corruptBody, faultStatus, pickFault, pickSessionFault, type Fault} from './faults'
import {reportFinding} from './findings'
import {mutateJson} from './mutate'
import {goOfflineFor} from './network'
import {addVocab} from './vocab'
import type {LineFile} from './line-file'
import type {Random} from './random'
import {readTape, RequestCounter, requestKey, tapeHoldsBody, type TapeEntry} from './tape'

/** How the chaos fetch behaves for one launch. */
export type ChaosFetchOptions = {
	mode: ChaosMode
	profile: ChaosProfile
	launch: number
	random: Random
	faultRate: number
	tape: LineFile
	sleep?: (ms: number) => Promise<void>
	/** The clock a session's offline windows are timed by. */
	now?: () => number
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

/** What the app gets for one request: the entry to tape, and a response to pass through untouched. */
type Answer = {entry: TapeEntry; passThrough: Response | null}

/** Fetches for real, applies `fault`, and returns what the app will get. */
async function answer(
	realFetch: typeof fetch,
	request: Request,
	key: string,
	fault: Fault,
): Promise<Answer> {
	let base = {key, headers: [] as Array<[string, string]>, body: '', status: 0, fault: fault.kind}
	let delayMs = fault.kind === 'latency' ? fault.delayMs : 0
	if (fault.kind === 'network') {
		return {entry: {...base, delayMs, error: 'network'}, passThrough: null}
	}
	try {
		let response = await realFetch(request)
		let entry: TapeEntry = {
			...base,
			status: faultStatus(fault, response.status),
			headers: [...response.headers.entries()],
			delayMs,
			error: null,
		}
		if (tapeHoldsBody(response.headers.get('content-type'))) {
			let text = await response.text()
			if (fault.kind === 'mutated') {
				let mutation = mutateJson(text, fault.pick, fault.roll)
				if (!mutation) {
					return {entry: {...entry, fault: 'none', body: text}, passThrough: null}
				}
				let {path, change} = mutation
				reportFinding('mutation', `${key} ${path}: ${change}`)
				return {entry: {...entry, body: mutation.body, mutation: {path, change}}, passThrough: null}
			}
			return {entry: {...entry, body: corruptBody(fault, text)}, passThrough: null}
		}
		// A binary body cannot be rebuilt from the tape, so the real response
		// goes through, dropping any fault that would touch its body. A status
		// fault cannot change a real response, so it is delivered from the tape
		// with an empty body.
		if (fault.kind === 'status') {
			return {entry, passThrough: null}
		}
		let kind: Fault['kind'] = fault.kind === 'latency' ? 'latency' : 'none'
		return {entry: {...entry, fault: kind, live: true}, passThrough: response}
	} catch (error) {
		return {
			entry: {...base, delayMs, error: isAbort(error) ? 'abort' : 'network'},
			passThrough: null,
		}
	}
}

/** Waits out the latency `entry` was recorded with. */
async function delay(entry: TapeEntry, sleep: (ms: number) => Promise<void>): Promise<void> {
	if (entry.delayMs > 0) {
		await sleep(entry.delayMs)
	}
}

/** Turns a tape entry back into what `fetch` would have done. */
async function deliver(entry: TapeEntry, sleep: (ms: number) => Promise<void>): Promise<Response> {
	await delay(entry, sleep)
	if (entry.error === 'abort') {
		throw abortError()
	}
	if (entry.error === 'network') {
		throw networkError()
	}
	if (entry.body) {
		addVocab(entry.body)
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
	let now = options.now ?? Date.now
	let offlineUntil = 0
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
			if (entry.offlineMs) {
				goOfflineFor(entry.offlineMs)
			}
			if (entry.live) {
				await delay(entry, sleep)
				return realFetch(request)
			}
			return deliver(entry, sleep)
		}

		// A session draws only from its own picker, so each request takes the same draws.
		let fault: Fault
		let offline: Pick<TapeEntry, 'offline' | 'offlineMs'> = {}
		if (options.profile === 'session') {
			let at = now()
			let picked = pickSessionFault(options.random, at, offlineUntil)
			fault = picked.fault
			if (picked.offline) {
				let began = picked.offlineUntil !== offlineUntil
				offline = began ? {offline: true, offlineMs: picked.offlineUntil - at} : {offline: true}
				if (began) {
					goOfflineFor(picked.offlineUntil - at)
				}
				offlineUntil = picked.offlineUntil
			}
		} else {
			fault = pickFault(options.random, options.faultRate)
		}
		let answered = await answer(realFetch, request, key, fault)
		let entry: TapeEntry = {...answered.entry, ...offline}
		let passThrough = answered.passThrough
		options.tape.append(JSON.stringify(entry))
		if (passThrough) {
			await delay(entry, sleep)
			return passThrough
		}
		return deliver(entry, sleep)
	}
}
