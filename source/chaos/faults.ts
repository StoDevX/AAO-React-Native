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
	| {kind: 'mutated'}

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
 * branch; the rest are spread evenly over the transport kinds.
 */
export function pickFault(random: Random, rate: number): Fault {
	if (random() >= rate) {
		return {kind: 'none'}
	}
	if (random() < 0.5) {
		return {kind: 'mutated'}
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
