import {File, Paths} from 'expo-file-system'
import {fetchSourceBody, SourceFetchError} from '@frogpond/data-sources'
import {fixtureMode} from '@frogpond/launch-arguments'

import {uiTestFixture} from '../../../lib/ui-test-fixture'
import fixtures from '../__fixtures__/mess.json'

type Format = 'json' | 'text'

/** One fetch as recorded: its answer, or the status it failed with. */
export type Recording = {href: string; format: Format; body?: unknown; status?: number}

/** Where a recording run appends each fetch, one JSON object per line. */
export const RECORDING_FILE = 'fixture-recording.jsonl'

/** A fixture's key: the same URL fetched as JSON and as text is two fixtures. */
export function fixtureKey(format: Format, href: string): string {
	return `${format} ${href}`
}

/** A fetch the fixtures have no answer for: the tests reach somewhere new. */
export class MissingMessFixture extends Error {
	constructor(key: string) {
		super(`No Olaf Messenger fixture for "${key}"; run mise run update-mess-fixtures`)
	}
}

const table = fixtures as Record<string, unknown>

function serve(href: string, format: Format): unknown {
	let key = fixtureKey(format, href)
	if (!(key in uiTestFixture('mess.json', table))) {
		throw new MissingMessFixture(key)
	}
	let answer = table[key]
	// A failure is recorded as its status alone, and fails the same way again.
	if (
		answer &&
		typeof answer === 'object' &&
		'status' in answer &&
		Object.keys(answer).length === 1
	) {
		let {status} = answer as {status: number}
		throw new SourceFetchError(`fixture fetch failed: ${status}`, status)
	}
	return answer
}

function record(entry: Recording): void {
	let file = new File(Paths.document, RECORDING_FILE)
	if (!file.exists) {
		file.create()
	}
	file.write(`${JSON.stringify(entry)}\n`, {append: true})
}

/**
 * fetchSourceBody for Olaf Messenger, which UI tests answer from fixtures: from the
 * network as usual, from `__fixtures__/mess.json` under UI tests, or from the network
 * with each answer saved under `--record-fixtures`, for update-mess-fixtures to collect.
 */
export async function messFetch(
	href: string,
	signal: AbortSignal,
	label: string,
	format: Format = 'json',
): Promise<unknown> {
	if (fixtureMode === 'serve') {
		return serve(href, format)
	}
	if (fixtureMode === 'live') {
		return fetchSourceBody(href, signal, label, format)
	}
	try {
		let body = await fetchSourceBody(href, signal, label, format)
		record({href, format, body})
		return body
	} catch (error) {
		if (error instanceof SourceFetchError) {
			record({href, format, status: error.status})
		}
		throw error
	}
}
