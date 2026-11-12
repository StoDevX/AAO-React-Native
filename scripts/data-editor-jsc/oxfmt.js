// oxfmt for the helper in JavaScriptCore. Its add-on loads only into Node, so
// the host runs oxfmt's standalone binary on the text instead.

export function format(file, source, options) {
	return Promise.resolve(globalThis.__host.oxfmt(file, source, JSON.stringify(options)))
}
