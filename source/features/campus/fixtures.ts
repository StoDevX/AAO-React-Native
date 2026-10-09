import {File, Paths} from 'expo-file-system'
import {campusRoots, setFetchInterceptor} from '@frogpond/api'
import {reportMissingFixture, type FixtureMode} from '@frogpond/launch-arguments'

import {uiTestFixture} from '../../lib/ui-test-fixture'
import {campusById, requireCampusId, type CampusId} from '../../campuses'
import {undatedUrl} from './fixture-dates'
import carletonFixtures from './__fixtures__/edu.carleton'
import exampleCollegeFixtures from './__fixtures__/example.college'
import stolafFixtures from './__fixtures__/edu.stolaf'

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

/** Each campus's recordings, by campus id, one file per request. */
const FILES: Record<string, ReadonlyArray<CampusRecordingFile>> = {
	'edu.stolaf': stolafFixtures,
	'edu.carleton': carletonFixtures,
	'example.college': exampleCollegeFixtures as ReadonlyArray<CampusRecordingFile>,
}

/**
 * A campus's recordings, keyed by request. Refuses a file a release bundle
 * emptied (metro.config.js), naming the fix.
 */
export function tableFrom(campus: string, files: ReadonlyArray<CampusRecordingFile>): Table {
	let table: Table = {}
	for (let file of files) {
		let {key, status, contentType = null, json, text} = uiTestFixture(`${campus} recordings`, file)
		if (key === undefined || status === undefined) {
			throw new Error(
				`A ${campus} recording has no request; rerecord it with mise run update-campus-fixtures ${campus}`,
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
 * `{server:<campus id>}`, so a recording against one server serves any other.
 */
export function fixtureKey(
	method: string,
	url: string,
	roots: Readonly<Record<string, URL | undefined>>,
): string {
	let undated = undatedUrl(url)
	for (let [campus, root] of Object.entries(roots)) {
		let prefix = root?.href.replace(/\/$/u, '')
		if (prefix && undated.startsWith(`${prefix}/`)) {
			return `${method.toUpperCase()} {server:${campus}}${undated.slice(prefix.length)}`
		}
	}
	return `${method.toUpperCase()} ${undated}`
}

/** A request a campus test made that its recordings cannot answer. */
export class MissingCampusFixture extends Error {
	constructor(campus: string, key: string) {
		super(`No ${campus} recording for "${key}"; run mise run update-campus-fixtures ${campus}`)
	}
}

/** The recorded answer to `request`. */
export function serveFixture(
	campus: string,
	table: Table,
	request: Request,
	roots: Readonly<Record<string, URL | undefined>>,
): Response {
	// The campus's own server first: one moved to another campus's address
	// still names its own paths. A recording keyed by another campus's server,
	// such as the platform manifest, is found by the usual order.
	let key = fixtureKey(request.method, request.url, {[campus]: roots[campus], ...roots})
	let recording = table[key] ?? table[fixtureKey(request.method, request.url, roots)]
	if (!recording) {
		reportMissingFixture(campus, key)
		throw new MissingCampusFixture(campus, key)
	}
	let headers = recording.contentType ? {'content-type': recording.contentType} : undefined
	return new Response(recording.status === 204 ? null : recording.body, {
		status: recording.status,
		headers,
	})
}

function append(entry: {key: string} & CampusRecording): void {
	let file = new File(Paths.document, CAMPUS_RECORDING_FILE)
	if (!file.exists) {
		file.create()
	}
	file.write(`${JSON.stringify(entry)}\n`, {append: true})
}

/** Whether `id` names a campus answered from its fixtures. */
function fixtureServed(id: CampusId | null): boolean {
	return id !== null && campusById(id).api.fixtureServer === true
}

/** Whether moving from `prev` to `next` starts or stops answering from fixtures. */
export function fixtureCampusChanged(prev: CampusId | null, next: CampusId | null): boolean {
	return prev !== next && (fixtureServed(prev) || fixtureServed(next))
}

/** A request answered from `campus`'s table, rejecting (not throwing) when it has none. */
function answer(campus: string, table: Table, request: Request): Promise<Response> {
	return Promise.resolve().then(() => serveFixture(campus, table, request, campusRoots()))
}

/**
 * Answers every request from the active campus's fixtures while that campus
 * has no server of its own (`api.fixtureServer`); any other campus's requests
 * go to the network. Outside UI tests that name a campus, in every build.
 */
export function installFixtureServer(activeCampus: () => CampusId | null): void {
	let tables = new Map<CampusId, Table>()
	setFetchInterceptor((request, next) => {
		let id = activeCampus()
		if (id === null || !fixtureServed(id)) {
			return next(request)
		}
		let table = tables.get(id) ?? tableFrom(id, FILES[id] ?? [])
		tables.set(id, table)
		return answer(id, table, request)
	})
}

/**
 * Answers every request from `campus`'s recordings (`serve`), or from the
 * network while recording each answer (`record`), for a UI test that names a
 * campus. A campus with no server (`api.fixtureServer`) is served in any
 * mode: there is nothing to record. An id no campus here has fails at once,
 * naming the ones there are, rather than at the first request.
 */
export function installCampusFixtures(campus: string, mode: FixtureMode): void {
	let id = requireCampusId(campus, '--campus')
	if (mode === 'serve' || campusById(id).api.fixtureServer) {
		let table = tableFrom(campus, FILES[campus] ?? [])
		setFetchInterceptor((request) => answer(campus, table, request))
		return
	}
	if (mode === 'record') {
		setFetchInterceptor(async (request, next) => {
			let key = fixtureKey(request.method, request.url, campusRoots())
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
