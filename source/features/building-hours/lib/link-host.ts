/**
 * The host to show beside a link, or the text itself when it does not parse.
 * A URL half typed into an editor is not an error worth reporting back.
 */
export function linkHost(url: string): string {
	try {
		return new URL(url).host
	} catch {
		return url
	}
}
