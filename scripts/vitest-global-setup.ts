// Pre-process React Native files before Vitest runs.
// This runs once in globalSetup and:
// 1. Strips Flow types AND compiles JSX in .js files (via flow-remove-types + esbuild)
// 2. Creates platform shims (Foo.js → Foo.ios.js) where only .ios.js exists

import {readFileSync, writeFileSync, readdirSync, existsSync} from 'node:fs'
import {join, resolve, dirname} from 'node:path'
import removeTypes from 'flow-remove-types'
import {transformSync} from 'esbuild'

const MARKER = '/* vitest-rn-processed */'

function processFile(fullPath: string): boolean {
	const code = readFileSync(fullPath, 'utf-8')
	if (code.startsWith(MARKER)) return false

	const hasFlow = /@flow/.test(code) || /import typeof/.test(code)
	const hasJsx = /<[A-Z]/.test(code)

	if (!hasFlow && !hasJsx) return false

	try {
		let processed = code
		// Step 1: Strip Flow types if present
		if (hasFlow) {
			processed = removeTypes(processed, {all: true}).toString()
		}
		// Step 2: Compile JSX if present
		if (hasJsx || /<[A-Z]/.test(processed)) {
			const result = transformSync(processed, {
				loader: 'jsx',
				jsx: 'transform',
			})
			processed = result.code
		}
		writeFileSync(fullPath, MARKER + '\n' + processed)
		return true
	} catch {
		// If processing fails, skip this file
		return false
	}
}

function processDir(dir: string): number {
	let count = 0
	if (!existsSync(dir)) return count

	for (const entry of readdirSync(dir, {withFileTypes: true})) {
		const fullPath = join(dir, entry.name)

		if (entry.isDirectory()) {
			if (entry.name === 'Renderer' || entry.name === '__tests__') continue
			count += processDir(fullPath)
		} else if (entry.isFile() && /\.js$/.test(entry.name)) {
			if (processFile(fullPath)) count++
		}
	}
	return count
}

function createPlatformShims(dir: string): number {
	let count = 0
	if (!existsSync(dir)) return count

	for (const entry of readdirSync(dir, {withFileTypes: true})) {
		const fullPath = join(dir, entry.name)

		if (entry.isDirectory()) {
			if (entry.name === 'Renderer' || entry.name === '__tests__') continue
			count += createPlatformShims(fullPath)
		} else if (entry.isFile() && entry.name.endsWith('.ios.js')) {
			const baseName = entry.name.replace('.ios.js', '')
			const plainJsPath = join(dirname(fullPath), baseName + '.js')
			if (!existsSync(plainJsPath)) {
				writeFileSync(
					plainJsPath,
					`${MARKER}\nmodule.exports = require('./${baseName}.ios.js');\n`,
				)
				count++
			}
		}
	}
	return count
}

export function setup(): void {
	const root = resolve(process.cwd(), 'node_modules')
	const dirs = [
		join(root, 'react-native'),
		join(root, '@react-native'),
		join(root, 'react-native-inappbrowser-reborn'),
		join(root, 'react-native-keychain'),
	]
	let processed = 0
	let shims = 0
	for (const dir of dirs) {
		processed += processDir(dir)
		shims += createPlatformShims(dir)
	}
	if (processed > 0 || shims > 0) {
		console.log(
			`[vitest-rn-setup] Processed ${processed} files, created ${shims} platform shims`,
		)
	}
}
