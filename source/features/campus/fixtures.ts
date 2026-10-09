import {File, Paths} from 'expo-file-system'
import {getApiRoot, getCarletonApiRoot, setFetchInterceptor} from '@frogpond/api'
import type {FixtureMode} from '@frogpond/launch-arguments'

import {uiTestFixture} from '../../lib/ui-test-fixture'
import {campusFromDomain} from './domains'
import {undatedUrl} from './fixture-dates'
import carletonFixtures from './__fixtures__/carleton.edu'
import stolafFixtures from './__fixtures__/stolaf.edu'

/** One response as recorded: enough to answer the same request again. */
export type CampusRecording = {status: number; contentType: string | null; body: string}

type Table = Record<string, CampusRecording>

/** One recorded request as its file holds it: a JSON answer as JSON, any other as its text. */
export type CampusRecordingFile = {
	key?: string
	status?: number
	contentType?: string | null
	json?: unknown
	text?: string
}

/** Each campus's recordings, by domain, one file per request. */
const FILES: Record<string, ReadonlyArray<CampusRecordingFile>> = {
	'stolaf.edu': stolafFixtures,
	'carleton.edu': carletonFixtures,
}

/**
 * A campus's recordings, keyed by request. Refuses a file a release bundle
 * emptied (metro.config.js), naming the fix.
 */
export function tableFrom(domain: string, files: ReadonlyArray<CampusRecordingFile>): Table {
	let table: Table = {}
	for (let file of files) {
		let {key, status, contentType = null, json, text} = uiTestFixture(`${domain} recordings`, file)
		if (key === undefined || status === undefined) {
			throw new Error(
				`A ${domain} recording has no request; rerecord it with mise run update-campus-fixtures ${domain}`,
			)
		}
		table[key] = {
			status,
			contentType,
			body: json === undefined ? (text ?? '') : JSON.stringify(json),
		}
	}
	return table
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
	let undated = undatedUrl(url)
	for (let [domain, root] of Object.entries(roots)) {
		let prefix = root?.href.replace(/\/$/u, '')
		if (prefix && undated.startsWith(`${prefix}/`)) {
			return `${method.toUpperCase()} {server:${domain}}${undated.slice(prefix.length)}`
		}
	}
	return `${method.toUpperCase()} ${undated}`
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
 * campus. A domain no campus here has fails at once, naming the ones there
 * are, rather than at the first request.
 */
export function installCampusFixtures(domain: string, mode: FixtureMode): void {
	campusFromDomain(domain)
	if (mode === 'serve') {
		let table = tableFrom(domain, FILES[domain] ?? [])
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
