/**
 * Who imports whom, across the app's JavaScript.
 *
 * The UI-test selector walks this backwards from a changed file to the route
 * files under app/ that can reach it. Every file under app/, source/ and
 * modules/ is parsed with Babel, which already compiles the app, so the graph
 * sees the same syntax Metro does.
 */

import {parseSync} from '@babel/core'
import path from 'node:path'

const ROOTS = ['app/', 'source/', 'modules/']
const EXTENSIONS = ['.ts', '.tsx', '.js', '.jsx', '.json']
const GRAPH_FILE = /\.(tsx?|jsx?|json)$/u

/**
 * The parser plugins a file needs. A .ts file must not get JSX, which reads
 * a `<number>x` cast as an element.
 */
function pluginsFor(file) {
	if (file.endsWith('.ts')) return ['typescript']
	if (file.endsWith('.tsx')) return ['typescript', 'jsx']
	return ['jsx']
}

/** Call `onNode` for every AST node under `node`, depth first. */
function visit(node, onNode) {
	if (!node || typeof node.type !== 'string') return
	onNode(node)
	for (const value of Object.values(node)) {
		if (Array.isArray(value)) {
			for (const child of value) visit(child, onNode)
		} else if (value && typeof value === 'object') {
			visit(value, onNode)
		}
	}
}

/** The literal string a call passes first, or null. */
function firstStringArgument(call) {
	const [first] = call.arguments
	return first?.type === 'StringLiteral' ? first.value : null
}

/**
 * The specifiers a file imports: `import`, `export … from`, and `require` or
 * `import()` with a literal path. A computed path cannot be followed.
 * @param {string} file
 * @param {string} text
 * @returns {string[]}
 */
export function parseImports(file, text) {
	if (file.endsWith('.json')) return []
	const ast = parseSync(text, {
		filename: file,
		configFile: false,
		babelrc: false,
		sourceType: 'unambiguous',
		parserOpts: {plugins: pluginsFor(file)},
	})
	const specifiers = []
	visit(ast.program, (node) => {
		if (
			(node.type === 'ImportDeclaration' ||
				node.type === 'ExportNamedDeclaration' ||
				node.type === 'ExportAllDeclaration') &&
			node.source
		) {
			specifiers.push(node.source.value)
		} else if (node.type === 'ImportExpression' && node.source.type === 'StringLiteral') {
			specifiers.push(node.source.value)
		} else if (
			node.type === 'CallExpression' &&
			(node.callee.type === 'Import' ||
				(node.callee.type === 'Identifier' && node.callee.name === 'require'))
		) {
			const specifier = firstStringArgument(node)
			if (specifier !== null) specifiers.push(specifier)
		}
	})
	return specifiers
}

/**
 * The file an import lands on, tried the way Metro tries it: the path as
 * written, then with each extension, then as a folder's index. Only relative
 * paths and `@frogpond/*` (the workspace packages in modules/) are followed;
 * any other package is outside the graph, and a change to one changes
 * package.json or the lockfile, which runs every UI test anyway.
 * @param {string} fromFile
 * @param {string} specifier
 * @param {{files: Set<string>, mains: Map<string, string>}} context
 * @returns {string | null}
 */
export function resolveSpecifier(fromFile, specifier, {files, mains}) {
	let base
	if (specifier.startsWith('.')) {
		base = path.posix.join(path.posix.dirname(fromFile), specifier)
	} else if (specifier.startsWith('@frogpond/')) {
		const [, name, ...rest] = specifier.split('/')
		base =
			rest.length > 0
				? `modules/${name}/${rest.join('/')}`
				: path.posix.join(`modules/${name}`, mains.get(name) ?? 'index')
	} else {
		return null
	}

	const candidates = [
		base,
		...EXTENSIONS.map((extension) => base + extension),
		...EXTENSIONS.map((extension) => `${base}/index${extension}`),
	]
	return candidates.find((candidate) => files.has(candidate)) ?? null
}

/** Each workspace package's entry file, from its package.json `main`. */
function moduleMains(tree) {
	const mains = new Map()
	for (const file of tree.list()) {
		const match = file.match(/^modules\/([^/]+)\/package\.json$/u)
		if (match) {
			const {main} = JSON.parse(tree.read(file))
			if (main) mains.set(match[1], main.replace(/^\.\//u, ''))
		}
	}
	return mains
}

/**
 * For every file under app/, source/ and modules/, the files that import it.
 * @param {{list(): string[], read(path: string): string}} tree
 * @returns {Map<string, Set<string>>}
 */
export function buildImporters(tree) {
	const files = tree
		.list()
		.filter((file) => ROOTS.some((root) => file.startsWith(root)) && GRAPH_FILE.test(file))
	const context = {files: new Set(files), mains: moduleMains(tree)}
	const importers = new Map()
	for (const file of files) {
		for (const specifier of parseImports(file, tree.read(file))) {
			const target = resolveSpecifier(file, specifier, context)
			if (target === null) continue
			if (!importers.has(target)) importers.set(target, new Set())
			importers.get(target).add(file)
		}
	}
	return importers
}

/**
 * Every file under app/ that `file` reaches by following importers, `file`
 * itself included. The walk goes on past an app/ file, since one route file
 * can be imported by another, or by the root layout.
 * @param {string} file
 * @param {Map<string, Set<string>>} importers
 * @returns {Set<string>}
 */
export function appFilesReaching(file, importers) {
	const seen = new Set([file])
	const queue = [file]
	const reached = new Set()
	while (queue.length > 0) {
		const current = queue.shift()
		if (current.startsWith('app/')) reached.add(current)
		for (const importer of importers.get(current) ?? []) {
			if (!seen.has(importer)) {
				seen.add(importer)
				queue.push(importer)
			}
		}
	}
	return reached
}
