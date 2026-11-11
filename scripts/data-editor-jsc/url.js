// node:url for the helper in JavaScriptCore: file URLs to paths and back.

export function fileURLToPath(url) {
	return decodeURIComponent(String(url).replace(/^file:\/\//u, ''))
}

export function pathToFileURL(file) {
	return new URL(`file://${encodeURI(file)}`)
}

export default {fileURLToPath, pathToFileURL}
