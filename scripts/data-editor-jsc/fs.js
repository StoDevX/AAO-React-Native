// node:fs for the data editor's helper in JavaScriptCore: the calls the data
// scripts make, each passed to the Mac app's Swift host as `__host`.

const host = () => globalThis.__host

/** A missing path's error as Node throws it from `syscall`, which the scripts tell apart by `code`. */
const missing = (file, syscall) =>
	Object.assign(new Error(`ENOENT: no such file or directory, ${syscall} '${file}'`), {
		errno: -2,
		code: 'ENOENT',
		syscall,
		path: file,
	})

function stats(file, syscall) {
	let found = host().stat(file)
	if (!found) throw missing(file, syscall)
	return {
		isDirectory: () => found.isDirectory,
		isFile: () => !found.isDirectory,
		size: found.size,
		mtimeMs: found.mtimeMs,
		mtime: new Date(found.mtimeMs),
	}
}

/** The file's text; the data scripts read only text. */
export function readFileSync(file) {
	let text = host().readFile(String(file))
	if (text === null || text === undefined) throw missing(file, 'open')
	return text
}

export function writeFileSync(file, data) {
	host().writeFile(String(file), String(data))
}

export function existsSync(file) {
	return Boolean(host().stat(String(file)))
}

export function statSync(file, options) {
	if (options?.throwIfNoEntry === false && !host().stat(String(file))) return
	return stats(String(file), 'stat')
}

export function lstatSync(file, options) {
	if (options?.throwIfNoEntry === false && !host().stat(String(file))) return
	return stats(String(file), 'lstat')
}

export function readdirSync(directory, options) {
	directory = String(directory)
	let names = host().readdir(directory)
	if (names === null || names === undefined) throw missing(directory, 'scandir')
	names = [...names].sort((a, b) => (a < b ? -1 : a > b ? 1 : 0))
	if (options?.recursive) {
		if (options.withFileTypes) {
			throw new Error('readdirSync with recursive and withFileTypes has no stand-in')
		}
		return names.flatMap((name) =>
			host().stat(`${directory}/${name}`)?.isDirectory
				? [
						name,
						...readdirSync(`${directory}/${name}`, {recursive: true}).map(
							(inner) => `${name}/${inner}`,
						),
					]
				: [name],
		)
	}
	if (!options?.withFileTypes) return names
	return names.map((name) => {
		let found = host().stat(`${directory}/${name}`)
		return {
			name,
			parentPath: directory,
			path: directory,
			isDirectory: () => Boolean(found?.isDirectory),
			isFile: () => Boolean(found) && !found.isDirectory,
		}
	})
}

export function mkdirSync(directory, options) {
	host().mkdir(String(directory), Boolean(options?.recursive))
}

export function rmSync(file, options) {
	host().rm(String(file), Boolean(options?.force))
}

export function renameSync(from, to) {
	host().rename(String(from), String(to))
}

export function copyFileSync(from, to) {
	host().copyFile(String(from), String(to))
}

export function realpathSync(file) {
	return host().realpath(String(file))
}
realpathSync.native = realpathSync

export function mkdtempSync(prefix) {
	return host().mkdtemp(String(prefix))
}

/** `bundle-data-dir` writes each bundle through a stream, all at once. */
export function createWriteStream(file) {
	let written = ''
	return {
		write(data) {
			written += String(data)
			host().writeFile(String(file), written)
			return true
		},
		end(data) {
			if (data !== undefined) this.write(data)
		},
		on() {
			return this
		},
		once() {
			return this
		},
	}
}

/** Only scripts the helper never runs copy folders. */
export function cpSync() {
	throw new Error('cpSync has no stand-in in the Mac app')
}

export default {
	readFileSync,
	writeFileSync,
	existsSync,
	statSync,
	lstatSync,
	readdirSync,
	mkdirSync,
	rmSync,
	renameSync,
	copyFileSync,
	realpathSync,
	mkdtempSync,
	createWriteStream,
	cpSync,
}
