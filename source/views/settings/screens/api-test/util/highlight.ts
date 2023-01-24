/**
 * Adds syntax highlighting directives to json
 * https://dev.to/gauravadhikari1997/show-json-as-pretty-print-with-syntax-highlighting-3jpm
 *
 * @param json
 * @returns string
 */
export function syntaxHighlight(json: string): string {
	if (!json) return ''

	json = json
		.replace(/&/gu, '&amp;')
		.replace(/</gu, '&lt;')
		.replace(/>/gu, '&gt;')

	const replaceRegex =
		/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+-]?\d+)?)/gu

	return json.replace(replaceRegex, function (match) {
		let cls = 'number'
		if (/^"/u.test(match)) {
			if (/:$/u.test(match)) {
				cls = 'key'
			} else {
				cls = 'string'
			}
		} else if (/true|false/u.test(match)) {
			cls = 'boolean'
		} else if (/null/u.test(match)) {
			cls = 'null'
		}
		return '<span class="' + cls + '">' + match + '</span>'
	})
}
