/** One `srcset` candidate: its address, and the width or pixel density it is listed at. */
type Candidate = {url: string; size: number; unit: 'w' | 'x'}

/**
 * `url` resolved against `base`, the image's own absolute address: a scheme-relative
 * `//host/…`, a root-relative `/…`, or a path beside the image. `URL` is not used because
 * React Native's resolves against a base only in part.
 */
function resolve(url: string, base: string): string {
	if (/^[a-z][a-z\d+.-]*:/iu.test(url)) return url
	let scheme = /^[a-z][a-z\d+.-]*:/iu.exec(base)?.[0] ?? 'https:'
	if (url.startsWith('//')) return `${scheme}${url}`
	let origin = /^[a-z][a-z\d+.-]*:\/\/[^/]+/iu.exec(base)?.[0] ?? ''
	if (url.startsWith('/')) return `${origin}${url}`
	let directory = base.slice(0, base.lastIndexOf('/') + 1)
	return `${directory}${url}`
}

/** A candidate as `srcset` writes it, `address [descriptor]`; null for a descriptor it cannot read. */
function candidateOf(text: string, base: string): Candidate | null {
	let [url, descriptor, ...rest] = text.trim().split(/\s+/u)
	if (!url || rest.length > 0) return null
	// A candidate with no descriptor stands for 1x.
	let match = /^(\d+(?:\.\d+)?)([wx])$/u.exec(descriptor ?? '1x')
	if (!match?.[1] || !match[2]) return null
	return {url: resolve(url, base), size: Number(match[1]), unit: match[2] as 'w' | 'x'}
}

/**
 * The largest copy an `<img>`'s `srcset` offers, as an absolute address, or null when it
 * offers none. Widths are preferred to densities, which say less about the file. Candidates
 * are split at commas, so an address holding a comma is misread; WordPress writes none.
 */
export function largestSource(srcset: string | undefined, src: string): string | null {
	let candidates = (srcset ?? '')
		.split(',')
		.filter((text) => text.trim() !== '')
		.map((text) => candidateOf(text, src))
		.filter((candidate): candidate is Candidate => candidate !== null)
	let widths = candidates.filter((candidate) => candidate.unit === 'w')
	let pool = widths.length > 0 ? widths : candidates
	let largest = pool.reduce<Candidate | null>(
		(best, candidate) => (best && best.size >= candidate.size ? best : candidate),
		null,
	)
	return largest?.url ?? null
}
