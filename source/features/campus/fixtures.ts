import {File, Paths} from 'expo-file-system'
import {getApiRoot, getCarletonApiRoot, setFetchInterceptor} from '@frogpond/api'
import type {FixtureMode} from '@frogpond/launch-arguments'

import {uiTestFixture} from '../../lib/ui-test-fixture'
import carletonFixtures from './__fixtures__/carleton.edu.json'
import stolafFixtures from './__fixtures__/stolaf.edu.json'

/** One response as recorded: enough to answer the same request again. */
export type CampusRecording = {status: number; contentType: string | null; body: string}

type Table = Record<string, CampusRecording>

/** Each campus's recordings, by domain. */
const TABLES: Record<string, Table> = {
	'stolaf.edu': stolafFixtures as Table,
	'carleton.edu': carletonFixtures as Table,
}

/** Where a recording run appends each response, one JSON object per line. */
export const CAMPUS_RECORDING_FILE = 'campus-fixture-recording.jsonl'

/**
 * A request's key: its method and URL, with each campus server's root written
 * `{server:<domain>}`, so a recording against one server serves any other.
 */
export function fixtureKey(
	method: string,
	url: string,
	roots: Readonly<Record<string, URL | undefined>>,
): string {
	for (let [domain, root] of Object.entries(roots)) {
		let prefix = root?.href.replace(/\/$/u, '')
		if (prefix && url.startsWith(`${prefix}/`)) {
			return `${method.toUpperCase()} {server:${domain}}${url.slice(prefix.length)}`
		}
	}
	return `${method.toUpperCase()} ${url}`
}

/** A request a campus test made that its recordings cannot answer. */
export class MissingCampusFixture extends Error {
	constructor(domain: string, key: string) {
		super(`No ${domain} recording for "${key}"; run mise run update-campus-fixtures ${domain}`)
	}
}

/** The recorded answer to `request`. */
export function serveFixture(
	domain: string,
	table: Table,
	request: Request,
	roots: Readonly<Record<string, URL | undefined>>,
): Response {
	let key = fixtureKey(request.method, request.url, roots)
	let recording = table[key]
	if (!recording) {
		throw new MissingCampusFixture(domain, key)
	}
	let headers = recording.contentType ? {'content-type': recording.contentType} : undefined
	return new Response(recording.status === 204 ? null : recording.body, {
		status: recording.status,
		headers,
	})
}

function currentRoots(): Record<string, URL | undefined> {
	return {'stolaf.edu': getApiRoot(), 'carleton.edu': getCarletonApiRoot()}
}

function append(entry: {key: string} & CampusRecording): void {
	let file = new File(Paths.document, CAMPUS_RECORDING_FILE)
	if (!file.exists) {
		file.create()
	}
	file.write(`${JSON.stringify(entry)}\n`, {append: true})
}

/**
 * Answers every request from `domain`'s recordings (`serve`), or from the
 * network while recording each answer (`record`), for a UI test that names a
 * campus.
 */
export function installCampusFixtures(domain: string, mode: FixtureMode): void {
	if (mode === 'serve') {
		let table = uiTestFixture(`${domain}.json`, TABLES[domain] ?? {})
		setFetchInterceptor((request) =>
			Promise.resolve(serveFixture(domain, table, request, currentRoots())),
		)
		return
	}
	if (mode === 'record') {
		setFetchInterceptor(async (request, next) => {
			let key = fixtureKey(request.method, request.url, currentRoots())
			let response = await next(request)
			let body = await response.clone().text()
			append({
				key,
				status: response.status,
				contentType: response.headers.get('content-type'),
				body,
			})
			return response
		})
	}
}
