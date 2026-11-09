import {spawn} from 'node:child_process'
import {existsSync, readFileSync, readdirSync} from 'node:fs'
import {rename, rm} from 'node:fs/promises'
import path from 'node:path'
import {load} from 'js-yaml'
import {isDataEntry} from './data-entries.mjs'
import {loadScheduleData} from './schedule-data.ts'

/** Something wrong with the data, at a path inside `file` when the message names one. */
export type Problem = {file: string | null; message: string; path: (string | number)[] | null}

/** An hours file as the editor's sidebar lists it. */
export type Building = {file: string; name: string; category: string}

/** The break calendar as the break-schedule editor offers it. */
export type Calendar = {
	breaks: {key: string; name: string; start: string; end: string; templates: string[]}[]
	templates: string[]
}

type Key = string | number

const keyOf = (text: string): Key => (/^\d+$/u.test(text) ? Number(text) : text)

/** The keys in `/schedule/0/hours` (Ajv's pointers) or `.breakSchedule.fall[0]` (the schedule checks'). */
export function keysOf(rest: string): Key[] {
	if (rest.startsWith('/')) {
		return rest
			.slice(1)
			.split('/')
			.filter(Boolean)
			.map((key) => keyOf(key.replaceAll('~1', '/').replaceAll('~0', '~')))
	}
	return [...rest.matchAll(/\.([^.[\]]+)|\[(\d+)\]/gu)].map((match) =>
		match[1] !== undefined ? match[1] : Number(match[2]),
	)
}

/** The problems in an error from `loadScheduleData`, each tied to the file whose label begins it. */
export function problemsFrom(error: unknown, dataDir: string): Problem[] {
	let text = error instanceof Error ? error.message : String(error)
	return text.split('; ').map((part) => {
		let match = /^(\S+?\.ya?ml)([^\s:]*):?\s+(.*)$/su.exec(part)
		let label = match?.[1]
		let rest = match?.[2] ?? ''
		let message = match?.[3]
		if (label === undefined || message === undefined) return {file: null, message: part, path: null}
		return {file: path.relative(dataDir, label), message, path: rest === '' ? null : keysOf(rest)}
	})
}

/** `file` checked as `mise run validate-data` checks it: its schema, then the whole schedule graph. */
export function validate(dataDir: string, file: string): Problem[] {
	let filename = path.join(dataDir, file)
	const kind = file === 'breaks.yaml' ? 'calendar' : 'space'
	try {
		loadScheduleData(dataDir, {kind, filename})
		return []
	} catch (error) {
		return problemsFrom(error, dataDir)
	}
}

const readYaml = (filename: string): unknown => load(readFileSync(filename, 'utf8'), {filename})

const text = (value: unknown, fallback: string): string =>
	typeof value === 'string' ? value : fallback

const asRecord = (value: unknown): Record<string, unknown> =>
	typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

/** Every hours file, sorted by category and then name. */
export function listBuildings(dataDir: string): Building[] {
	let dir = path.join(dataDir, 'building-hours')
	let buildings = readdirSync(dir)
		.filter(isDataEntry)
		.map((entry) => {
			let data = asRecord(readYaml(path.join(dir, entry)))
			return {
				file: path.join('building-hours', entry),
				name: text(data['name'], entry),
				category: text(data['category'], ''),
			}
		})
	let key = (b: Building) => `${b.category}\u0000${b.name}`
	return buildings.sort((a, b) => key(a).localeCompare(key(b)))
}

/** The breaks in `breaks.yaml` and the templates a building may name. */
export function readCalendar(dataDir: string): Calendar {
	let data = asRecord(readYaml(path.join(dataDir, 'breaks.yaml')))
	let breaks = Object.entries(asRecord(data['breaks'])).map(([key, raw]) => {
		let entry = asRecord(raw)
		return {
			key,
			name: text(entry['name'], key),
			start: text(entry['start'], ''),
			end: text(entry['end'], ''),
			templates: Object.keys(asRecord(entry['templates'])),
		}
	})
	return {breaks, templates: Object.keys(asRecord(data['templates']))}
}

/** What a failed `bundle-data` said last: its error's message, or its last line. */
export function lastError(stderr: string): string {
	let thrown = /^(?:\w*Error|YAMLException): (.*)$/mu.exec(stderr)
	if (thrown?.[1]) return thrown[1]
	return stderr.trim().split('\n').at(-1) ?? 'bundle-data failed'
}

function run(command: string, args: string[]): Promise<{code: number; stderr: string}> {
	return new Promise((resolve, reject) => {
		let child = spawn(command, args, {stdio: ['ignore', 'ignore', 'pipe']})
		let stderr = ''
		child.stderr.setEncoding('utf8')
		child.stderr.on('data', (chunk: string) => {
			stderr += chunk
		})
		child.once('error', reject)
		child.once('close', (code) => {
			resolve({code: code ?? 1, stderr})
		})
	})
}

/**
 * Runs `bundle-data` into a fresh folder and swaps it in for `outDir`, so the
 * data server only ever serves a whole build. A failure leaves `outDir` alone.
 */
export async function build({
	bundleData,
	dataDir,
	outDir,
}: {
	bundleData: string
	dataDir: string
	outDir: string
}): Promise<{ok: true} | {ok: false; problems: Problem[]}> {
	let next = `${outDir}.next`
	let old = `${outDir}.old`
	await rm(next, {recursive: true, force: true})
	let {code, stderr} = await run(process.execPath, [bundleData, dataDir, next])
	if (code !== 0) {
		await rm(next, {recursive: true, force: true})
		return {ok: false, problems: problemsFrom(new Error(lastError(stderr)), dataDir)}
	}
	await rm(old, {recursive: true, force: true})
	if (existsSync(outDir)) await rename(outDir, old)
	await rename(next, outDir)
	await rm(old, {recursive: true, force: true})
	return {ok: true}
}
