/**
 * The WordPress REST root a posts feed href hangs from: `https://olafmessenger.com/wp-json/wp/v2`
 * for the paper's own site, or `news/mess/wp/v2` for ccc-server's copy of it. Worked out from the
 * string, since `URL` cannot parse a relative href.
 */
export function wpRoot(feedHref: string): string {
	let path = feedHref.split(/[?#]/u, 1)[0] ?? ''
	let root = path.replace(/\/posts\/?$/u, '')
	if (root === path) throw new Error(`not a WordPress posts href: ${feedHref}`)
	return root
}
