import {spawn} from 'node:child_process'
import {existsSync} from 'node:fs'
import {mkdir, mkdtemp, readdir, rm} from 'node:fs/promises'
import path from 'node:path'
import {
	compiledSchema,
	fileSchema,
	loadCatalog,
	readYaml,
	setForFile,
} from './data-editor-datasets.mjs'
import {pointerKeys, wordProblems} from './data-editor-wording.mjs'
import {loadScheduleData} from './schedule-data.ts'

/** Something wrong with the data, at a path inside `file` when the message names one. */
export type Problem = {
	file: string | null
	message: string
	path: (string | number)[] | null
	/** the title of the field this problem says is missing, which is at `path` */
	missing?: string
}

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
		return pointerKeys(rest).map(keyOf)
	}
	return [...rest.matchAll(/\.([^.[\]]+)|\[(\d+)\]/gu)].map((match) =>
		match[1] !== undefined ? match[1] : Number(match[2]),
	)
}

/**
 * The problems in an error from `loadScheduleData`, each tied to the file whose
 * label begins it. Labels are absolute paths under `dataDir`, which may hold
 * spaces (`~/Library/Application Support`), so that prefix is taken off first.
 */
export function problemsFrom(error: unknown, dataDir: string): Problem[] {
	let text = error instanceof Error ? error.message : String(error)
	let prefix = path.resolve(dataDir) + path.sep
	// a new problem starts only where a file label does, so a message holding "; " stays whole
	let parts: string[] = []
	for (let piece of text.split('; ')) {
		if (parts.length > 0 && !piece.startsWith(prefix)) parts[parts.length - 1] += `; ${piece}`
		else parts.push(piece)
	}
	return parts.map((part) => {
		let relative = part.startsWith(prefix) ? part.slice(prefix.length) : undefined
		let match = relative === undefined ? null : /^(\S+?\.ya?ml)([^\s:]*):?\s+(.*)$/su.exec(relative)
		let file = match?.[1]
		let rest = match?.[2] ?? ''
		let message = match?.[3]
		if (file === undefined || message === undefined) return {file: null, message: part, path: null}
		return {file, message, path: rest === '' ? null : keysOf(rest)}
	})
}

/**
 * `file` checked as `mise run validate-data` checks it. A file of a set
 * whose form is hours or breaks is checked against its schema and then the
 * whole schedule graph; any other file against the schema of the set that holds it, its
 * problems worded with the schema's field titles. A file no set holds, or one
 * without a schema, has nothing to check, nor has a file that is gone.
 */
export function validate(dataDir: string, file: string): Problem[] {
	// a record the contributor removed has nothing left to check
	if (!existsSync(path.join(dataDir, file))) return []
	let catalog = loadCatalog(dataDir)
	let name = setForFile(catalog, file)
	if (name === undefined) return []
	let {form, schema: schemaName} = catalog.sets[name]
	if (form === 'hours' || form === 'breaks') {
		try {
			loadScheduleData(dataDir, {
				kind: form === 'breaks' ? 'calendar' : 'space',
				filename: path.join(dataDir, file),
			})
			return []
		} catch (error) {
			return problemsFrom(error, dataDir)
		}
	}
	if (schemaName === undefined) return []
	let check = compiledSchema(path.join(dataDir, '_schemas'), `${schemaName}.yaml`, {
		allErrors: true,
	})
	let data = readYaml(path.join(dataDir, file))
	if (check(data)) return []
	return wordProblems(check.errors, fileSchema(dataDir, catalog, name)).map(
		({
			message,
			instancePath,
			missing,
		}: {
			message: string
			instancePath: string
			missing?: string
		}) => ({
			file,
			message,
			path: keysIn(data, instancePath),
			...(missing === undefined ? {} : {missing}),
		}),
	)
}

/**
 * The keys in an Ajv pointer such as `/routes/77627/line`, each an index only
 * where `data` holds a list there: a map may be keyed by digits, as the bus
 * routes are by GTFS id, and an index would point the editor into a list.
 */
export function keysIn(data: unknown, pointer: string): Key[] {
	let keys: Key[] = []
	let value = data
	for (let key of pointerKeys(pointer)) {
		let step = Array.isArray(value) ? Number(key) : key
		keys.push(step)
		value = (value as Record<string | number, unknown> | null)?.[step]
	}
	return keys
}

const text = (value: unknown, fallback: string): string =>
	typeof value === 'string' ? value : fallback

const asRecord = (value: unknown): Record<string, unknown> =>
	typeof value === 'object' && value !== null ? (value as Record<string, unknown>) : {}

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

/**
 * What a failed `bundle-data` said: a thrown error's message (validation
 * errors are plain `Error`s, whose message names the file), Node's own error
 * line for anything else, or else its last line before Node's version banner.
 */
export function lastError(stderr: string): string {
	let thrown = /^(?:\w*Error|YAMLException): (.*)$/mu.exec(stderr)
	if (thrown?.[1]) return thrown[1]
	let coded = /^\w*Error \[\w+\]: .*$/mu.exec(stderr)
	if (coded) return coded[0]
	let lines = stderr
		.trim()
		.split('\n')
		.filter((line) => line.trim() !== '' && !line.startsWith('Node.js v'))
	return lines.at(-1) ?? 'bundle-data failed'
}

/**
 * The problems a failed `bundle-data` listed, one line each, or nothing when
 * it stopped without a list, as a crash does.
 */
function reportedProblems(stderr: string, dataDir: string): Problem[] | undefined {
	let lines = stderr.split('\n')
	let header = lines.findIndex((line) => /^bundle-data found \d+ problems?:$/u.test(line))
	if (header === -1) return undefined
	return lines
		.slice(header + 1)
		.filter((line) => line.trim() !== '')
		.flatMap((line) => problemsFrom(new Error(line), dataDir))
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
 * Runs `bundle-data` into a fresh folder under `outDir` and returns it. The
 * caller serves it from then on and removes the older ones with
 * `pruneBuilds`, so a build being served is never written to or moved. A
 * failure removes its own folder and leaves the others alone.
 */
export async function build({
	bundleData,
	dataDir,
	outDir,
}: {
	bundleData: string
	dataDir: string
	outDir: string
}): Promise<{ok: true; dir: string} | {ok: false; problems: Problem[]}> {
	await mkdir(outDir, {recursive: true})
	let dir = await mkdtemp(path.join(outDir, 'build-'))
	let {code, stderr} = await run(process.execPath, [bundleData, dataDir, dir])
	if (code !== 0) {
		await rm(dir, {recursive: true, force: true})
		let problems =
			reportedProblems(stderr, dataDir) ?? problemsFrom(new Error(lastError(stderr)), dataDir)
		return {ok: false, problems}
	}
	return {ok: true, dir}
}

/** Removes every build under `outDir` except those in `keep`. Only `build-` folders are builds. */
export async function pruneBuilds(outDir: string, ...keep: (string | undefined)[]): Promise<void> {
	let kept = new Set(keep.filter((dir) => dir !== undefined).map((dir) => path.basename(dir)))
	let others = (await readdir(outDir)).filter(
		(entry) => entry.startsWith('build-') && !kept.has(entry),
	)
	await Promise.all(
		others.map((entry) => rm(path.join(outDir, entry), {recursive: true, force: true})),
	)
}
