// The data sets the Mac data editor offers, read from `data/_datasets.yaml`,
// and the records in each.

import {readdirSync, readFileSync} from 'node:fs'
import path from 'node:path'
import {load} from 'js-yaml'
import {isDataEntry} from './data-entries.mjs'
import {createValidator} from './validate.mjs'

const readYaml = (filename) => load(readFileSync(filename, 'utf8'), {filename})

const fileOrder = new Intl.Collator(undefined, {numeric: true}).compare

/** `dataDir`'s catalog, checked against its schema. Throws naming the first problem. */
export function loadCatalog(dataDir) {
	let catalog = readYaml(path.join(dataDir, '_datasets.yaml'))
	let schemaDir = path.join(dataDir, '_schemas')
	let check = createValidator(schemaDir).compile(readYaml(path.join(schemaDir, '_datasets.yaml')))
	if (!check(catalog)) {
		let [error] = check.errors
		throw new Error(`_datasets.yaml${error.instancePath}: ${error.message}`)
	}
	return catalog
}

/** The value at a dotted path such as `titles.und`. */
const fieldAt = (value, field) =>
	field.split('.').reduce((inner, key) => (inner == null ? undefined : inner[key]), value)

const text = (value) => (typeof value === 'string' && value.trim() !== '' ? value : null)

function described(catalog, name) {
	let set = catalog.sets[name]
	if (set === undefined) throw new Error(`no data set named ${name}`)
	return set
}

/** The array or map of records at the set's `list` path. */
const listIn = (value, set) => set.list.reduce((inner, key) => inner?.[key], value)

/**
 * Every record in the set `name`: for a folder, one per file in published
 * order; for a list, one per item or map entry; otherwise the whole file.
 */
export function listRecords(dataDir, catalog, name) {
	let set = described(catalog, name)
	let generated = new Set(set.generated?.files)
	let summary = (file, recordPath, value, key) => ({
		set: name,
		file,
		path: recordPath,
		title:
			text(set.titleField === undefined ? key : fieldAt(value, set.titleField)) ??
			(set.shape === 'file' || set.shape === 'document' ? set.title : `Untitled ${set.record}`),
		subtitle: set.subtitleField === undefined ? null : text(fieldAt(value, set.subtitleField)),
		section: set.sectionField === undefined ? null : text(fieldAt(value, set.sectionField)),
		editable: set.readOnly === undefined && !generated.has(path.basename(file)),
	})

	switch (set.shape) {
		case 'folder':
			return readdirSync(path.join(dataDir, set.path))
				.filter(isDataEntry)
				.sort(fileOrder)
				.map((entry) => {
					let file = path.join(set.path, entry)
					return summary(file, [], readYaml(path.join(dataDir, file)))
				})
		case 'list': {
			let items = listIn(readYaml(path.join(dataDir, set.path)), set) ?? []
			return Array.isArray(items)
				? items.map((item, index) => summary(set.path, [...set.list, index], item))
				: Object.entries(items).map(([key, item]) =>
						summary(set.path, [...set.list, key], item, key),
					)
		}
		case 'file':
			return [summary(set.path, [], readYaml(path.join(dataDir, set.path)))]
		default:
			return [summary(set.path, [], undefined)]
	}
}

/**
 * `schema` with every `$ref` replaced by what it names, from `_defs.json` or
 * the schema's own definitions, since the app has no resolver. A definition
 * that refers back to itself, as a FAQ's nested conditions do, is cut off
 * there as `{}`: the form leaves such a field to an `editor: hidden` hint.
 */
function inlined(schema, root, defs, seen = new Set()) {
	if (Array.isArray(schema)) return schema.map((item) => inlined(item, root, defs, seen))
	if (schema === null || typeof schema !== 'object') return schema
	if (typeof schema.$ref === 'string') {
		let [document, pointer = ''] = schema.$ref.split('#')
		if (seen.has(schema.$ref)) return {}
		let base = document === '_defs.json' ? defs : root
		let target = pointer
			.split('/')
			.filter(Boolean)
			.reduce((inner, key) => inner?.[key], base)
		let {$ref, ...rest} = schema
		return inlined({...target, ...rest}, base, defs, new Set([...seen, $ref]))
	}
	let result = {}
	for (let [key, value] of Object.entries(schema)) {
		if (key === 'definitions' || key === '$schema' || key === '$id') continue
		result[key] = inlined(value, root, defs, seen)
	}
	return result
}

/** The schema for one record of the set `name`, with its references inlined. */
export function recordSchema(dataDir, catalog, name) {
	let set = described(catalog, name)
	if (set.schema === undefined) return {}
	let schemaDir = path.join(dataDir, '_schemas')
	let root = readYaml(path.join(schemaDir, `${set.schema}.yaml`))
	let defs = readYaml(path.join(schemaDir, '_defs.yaml'))
	let schema = inlined(root, root, defs)
	if (set.shape !== 'list') return schema
	let container = set.list.reduce((inner, key) => inner?.properties?.[key], schema)
	return container.items ?? container.additionalProperties
}
