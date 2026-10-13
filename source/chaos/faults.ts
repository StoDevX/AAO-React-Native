import type {Random} from './random'

/** What a chaos run does to one request. */
export type Fault =
	| {kind: 'none'}
	| {kind: 'latency'; delayMs: number}
	| {kind: 'status'; status: 404 | 500}
	| {kind: 'network'}
	| {kind: 'empty'}
	| {kind: 'malformed'}
	| {kind: 'truncated'}
	/** `pick` and `roll` choose the value changed and how, drawn with the fault rather than once the body arrives. */
	| {kind: 'mutated'; pick: number; roll: number}

const CHOICES = [
	'latency',
	'status-500',
	'status-404',
	'network',
	'empty',
	'malformed',
	'truncated',
] as const

/**
 * Whether a request is faulted, at `rate`, and how. Half of faults change a
 * value in the body, since the transport faults all land in the same error
 * branch; the rest are spread evenly over the transport kinds. Every draw a
 * fault needs is taken here, synchronously, so the faults follow request order.
 */
export function pickFault(random: Random, rate: number): Fault {
	if (random() >= rate) {
		return {kind: 'none'}
	}
	if (random() < 0.5) {
		// Drawn now, in request order: drawn when the body arrives, they would
		// follow the network's timing and a seed would not repeat its mutations.
		return {kind: 'mutated', pick: random(), roll: random()}
	}
	let choice = CHOICES[Math.floor(random() * CHOICES.length)]
	switch (choice) {
		case 'latency':
			return {kind: 'latency', delayMs: 500 + Math.floor(random() * 7500)}
		case 'status-500':
			return {kind: 'status', status: 500}
		case 'status-404':
			return {kind: 'status', status: 404}
		default:
			return {kind: choice}
	}
}

/** What a session's network does to one request, and when its offline window ends. */
export type SessionFault = {fault: Fault; offline: boolean; offlineUntil: number}

/** The share of online requests that take the network away, as a lift or a basement would. */
export const OFFLINE_START_RATE = 0.03

/** The share of other online requests a session faults. */
export const SESSION_FAULT_RATE = 0.05

/**
 * A session's fault for a request made at `now`, with the network offline
 * until `offlineUntil`. Inside a window every request fails; outside one a
 * few start a window, and a few more are slow, fail with a 500, or carry a
 * mutation. Seven draws for every request, so a seed's later faults do not
 * shift with what earlier requests got.
 */
export function pickSessionFault(random: Random, now: number, offlineUntil: number): SessionFault {
	let [start, length, faulted, kind, delay, pick, roll] = Array.from({length: 7}, () => random())
	if (now < offlineUntil) {
		return {fault: {kind: 'network'}, offline: true, offlineUntil}
	}
	if (start < OFFLINE_START_RATE) {
		let until = now + 5000 + Math.floor(length * 25_000)
		return {fault: {kind: 'network'}, offline: true, offlineUntil: until}
	}
	let online = {offline: false, offlineUntil}
	if (faulted >= SESSION_FAULT_RATE) {
		return {fault: {kind: 'none'}, ...online}
	}
	if (kind < 0.4) {
		return {fault: {kind: 'latency', delayMs: 500 + Math.floor(delay * 7500)}, ...online}
	}
	if (kind < 0.7) {
		return {fault: {kind: 'status', status: 500}, ...online}
	}
	return {fault: {kind: 'mutated', pick, roll}, ...online}
}

/** The body a response is left with after `fault`. */
export function corruptBody(fault: Fault, body: string): string {
	switch (fault.kind) {
		case 'empty':
			return ''
		case 'malformed':
			// Unterminated, so it fails as JSON and reads as damaged HTML.
			return `{"chaos":${body}`
		case 'truncated':
			return body.slice(0, Math.floor(body.length / 2))
		default:
			return body
	}
}

/** The status a response is left with after `fault`. */
export function faultStatus(fault: Fault, status: number): number {
	return fault.kind === 'status' ? fault.status : status
}
