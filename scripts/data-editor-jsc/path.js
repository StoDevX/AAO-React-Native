// node:path for the helper in JavaScriptCore: POSIX paths, as on the Mac.

export const sep = '/'
export const delimiter = ':'

export function normalize(file) {
	let absolute = file.startsWith('/')
	let parts = []
	for (let part of file.split('/')) {
		if (part === '' || part === '.') continue
		if (part === '..') {
			if (parts.length > 0 && parts.at(-1) !== '..') parts.pop()
			else if (!absolute) parts.push('..')
		} else parts.push(part)
	}
	let joined = (absolute ? '/' : '') + parts.join('/')
	return joined || (absolute ? '/' : '.')
}

export function join(...parts) {
	return normalize(parts.filter((part) => part !== '').join('/'))
}

export function resolve(...parts) {
	let resolved = ''
	for (let part of parts) {
		if (part.startsWith('/')) resolved = part
		else if (part !== '') resolved = resolved ? `${resolved}/${part}` : part
	}
	if (!resolved.startsWith('/')) resolved = `${globalThis.__host.cwd()}/${resolved}`
	return normalize(resolved)
}

export function isAbsolute(file) {
	return file.startsWith('/')
}

export function dirname(file) {
	let normal = normalize(file)
	let slash = normal.lastIndexOf('/')
	if (slash > 0) return normal.slice(0, slash)
	return normal.startsWith('/') ? '/' : '.'
}

export function basename(file, extension) {
	let base = normalize(file).split('/').at(-1)
	return extension && base.endsWith(extension) ? base.slice(0, -extension.length) : base
}

export function extname(file) {
	let base = basename(file)
	let dot = base.lastIndexOf('.')
	return dot <= 0 ? '' : base.slice(dot)
}

export function relative(from, to) {
	let a = resolve(from).split('/').filter(Boolean)
	let b = resolve(to).split('/').filter(Boolean)
	let shared = 0
	while (shared < a.length && shared < b.length && a[shared] === b[shared]) shared++
	return [...a.slice(shared).map(() => '..'), ...b.slice(shared)].join('/')
}

export function parse(file) {
	let base = basename(file)
	let ext = extname(file)
	return {
		root: file.startsWith('/') ? '/' : '',
		dir: dirname(file),
		base,
		ext,
		name: ext ? base.slice(0, -ext.length) : base,
	}
}

export function format(parts) {
	return (parts.dir ? `${parts.dir}/` : '') + (parts.base ?? (parts.name ?? '') + (parts.ext ?? ''))
}

const path = {
	sep,
	delimiter,
	normalize,
	join,
	resolve,
	isAbsolute,
	dirname,
	basename,
	extname,
	relative,
	parse,
	format,
}
path.posix = path
export const posix = path
export default path
