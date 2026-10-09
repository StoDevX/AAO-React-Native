import type {RouteEntry, RouteInput} from '../query'
import {isSafeMethod} from './method'

/** A route's inputs as a row's detail line: `cafeId`, or `dateFrom? · sort?`. */
export function inputSummary(inputs: RouteInput[]): string | undefined {
	if (!inputs.length) {
		return undefined
	}
	return inputs.map((input) => (input.required ? input.name : `${input.name}?`)).join(' · ')
}

/**
 * What tapping a route does: open the form when it needs something, ask first
 * when it can change the server, and otherwise send it at once.
 */
export function nextStep(
	entry: Pick<RouteEntry, 'method' | 'inputs'>,
): 'send' | 'confirm' | 'form' {
	if (entry.inputs.some((input) => input.required)) {
		return 'form'
	}
	return isSafeMethod(entry.method) ? 'send' : 'confirm'
}
