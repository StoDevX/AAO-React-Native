// Adding, removing and reordering the records of a data set, for the Mac data
// editor. A contributor names a record; the file names, numeric prefixes and
// list positions that follow from that are worked out here.

import {readFileSync} from 'node:fs'
import path from 'node:path'
import {load} from 'js-yaml'
import {listRecords, loadCatalog} from './data-editor-datasets.mjs'
import {DocumentStore} from './data-editor-documents.mjs'
import {validate} from './data-editor-pipeline.ts'

/** A file name's numeric prefix: `1-` or, in a sectioned folder, `1-2-`. */
const PREFIX = /^(\d+)-(?:(\d+)-)?/u

/**
 * `title` as a file name or key: lower case, accents folded, apostrophes
 * dropped, anything else not a letter or digit a hyphen; `-2`, `-3` and so on
 * while the result is in `taken`.
 */
export function slugFor(title, taken) {
	let base =
		title
			.normalize('NFKD')
			.replaceAll(/\p{Mn}/gu, '')
			.toLowerCase()
			.replaceAll(/['’]/gu, '')
			.replaceAll(/[^a-z0-9]+/gu, '-')
			.replaceAll(/^-+|-+$/gu, '') || 'untitled'
	let slug = base
	for (let n = 2; taken.has(slug); n += 1) slug = `${base}-${n}`
	return slug
}

/**
 * The names `names` take in the order given. A folder whose every name has a
 * two-part prefix (`1-2-pubsafe.yaml`) is sectioned by the first number: its
 * sections keep the order they first appear in, and the records number from 1
 * within each. Otherwise records number from 1 in order. A name without a
 * prefix keeps its name.
 */
export function orderedNames(names) {
	let sectioned = names.length > 0 && names.every((name) => PREFIX.exec(name)?.[2] !== undefined)
	let sections = new Map()
	let counts = new Map()
	return names.map((name, index) => {
		let match = PREFIX.exec(name)
		if (!match) return name
		let rest = name.slice(match[0].length)
		if (!sectioned) return `${index + 1}-${rest}`
		if (!sections.has(match[1])) sections.set(match[1], sections.size + 1)
		let section = sections.get(match[1])
		let count = (counts.get(section) ?? 0) + 1
		counts.set(section, count)
		return `${section}-${count}-${rest}`
	})
}

/** `value` with the dotted `field` set to `text`, as `titles.und` names a nested one. */
function withField(value, field, text) {
	let keys = field.split('.')
	let inner = value
	for (let key of keys.slice(0, -1)) {
		inner[key] ??= {}
		inner = inner[key]
	}
	inner[keys.at(-1)] = text
	return value
}

const readYaml = (filename) => load(readFileSync(filename, 'utf8'))

/** The set's records and what is wrong with `files`, as every operation replies. */
function reply(dataDir, catalog, name, files) {
	return {
		records: listRecords(dataDir, catalog, name),
		problems: files.flatMap((file) => validate(dataDir, file)),
	}
}

/**
 * The name a new record's file takes in a folder set: after every file there,
 * so it never takes a name in use. A sectioned folder's prefixes do not follow
 * its sections (the contacts' Safety and Wellness share `1-` and `2-`), and the
 * editor lists a record under its section whatever its prefix.
 */
function newFileName(records, set, slug) {
	let prefixes = records.map((record) => PREFIX.exec(path.basename(record.file)))
	if (!set.ordered || prefixes.length === 0 || prefixes.some((match) => !match)) {
		return `${slug}.yaml`
	}
	let next = Math.max(...prefixes.map((match) => Number(match[1]))) + 1
	return prefixes.every((match) => match[2] === undefined)
		? `${next}-${slug}.yaml`
		: `${next}-1-${slug}.yaml`
}

/**
 * Adds a record named `title` to the set `name`, in `section` when the set is
 * sectioned: a new file for a folder set, a new item or entry for a list set.
 * The record holds only its title and section, so its problems are reported
 * with the reply rather than thrown.
 */
export async function createRecord(dataDir, name, {title, section}) {
	let catalog = loadCatalog(dataDir)
	let set = catalog.sets[name]
	let store = new DocumentStore(dataDir)
	let value = {}
	if (set.titleField !== undefined) withField(value, set.titleField, title)
	if (set.sectionField !== undefined && section) withField(value, set.sectionField, section)

	if (set.shape === 'folder') {
		let records = listRecords(dataDir, catalog, name)
		let taken = new Set(
			records.map((record) => path.basename(record.file, '.yaml').replace(PREFIX, '')),
		)
		let file = path.join(set.path, newFileName(records, set, slugFor(title, taken)))
		await store.create(file, value)
		let result = reply(dataDir, catalog, name, [file])
		return {...result, created: result.records.find((record) => record.file === file)}
	}
	if (set.shape === 'list') {
		let list = set.list.reduce((inner, key) => inner?.[key], readYaml(path.join(dataDir, set.path)))
		let key = Array.isArray(list) ? list.length : slugFor(title, new Set(Object.keys(list ?? {})))
		let recordPath = [...set.list, key]
		await store.edit(set.path, [{path: recordPath, value}])
		let result = reply(dataDir, catalog, name, [set.path])
		let created = result.records.find(
			(record) => JSON.stringify(record.path) === JSON.stringify(recordPath),
		)
		return {...result, created}
	}
	throw new Error(`${set.title} has no records to add to`)
}

/** Removes the record at `file` and `path` from the set `name`. */
export async function removeRecord(dataDir, name, {file, path: recordPath}) {
	let catalog = loadCatalog(dataDir)
	let set = catalog.sets[name]
	let store = new DocumentStore(dataDir)
	if (set.shape === 'folder') {
		await store.remove(file)
		return reply(dataDir, catalog, name, [])
	}
	if (set.shape === 'list') {
		await store.edit(file, [{path: recordPath, delete: true}])
		return reply(dataDir, catalog, name, [file])
	}
	throw new Error(`${set.title} has no records to remove`)
}

/**
 * Puts the set's records in the order of `order`, each given by its file and
 * path: a folder's files are renamed for their new prefixes, and a list's
 * items move with their comments.
 */
export async function reorderRecords(dataDir, name, order) {
	let catalog = loadCatalog(dataDir)
	let set = catalog.sets[name]
	let store = new DocumentStore(dataDir)
	if (set.shape === 'folder') {
		let names = order.map((record) => path.basename(record.file))
		let moves = orderedNames(names)
			.map((to, index) => ({from: path.join(set.path, names[index]), to: path.join(set.path, to)}))
			.filter(({from, to}) => from !== to)
		await store.rename(moves)
		return reply(dataDir, catalog, name, [])
	}
	if (set.shape === 'list') {
		await store.reorderList(
			set.path,
			set.list,
			order.map((record) => record.path.at(-1)),
		)
		return reply(dataDir, catalog, name, [set.path])
	}
	throw new Error(`${set.title} has no records to reorder`)
}
