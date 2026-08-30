export interface JobSite {
	origin: string
	siteNumber: string
}

const API_PATH = '/hcmRestApi/resources/latest'
const REQUISITIONS = `${API_PATH}/recruitingCEJobRequisitions`
const DETAILS = `${API_PATH}/recruitingCEJobRequisitionDetails`

const SITE_HREF = /^(https?:\/\/[^/]+)\/.*\/sites\/([^/?#]+)\/?$/u

/// The manifest gives the public site URL, because everything else derives
/// from it: the API lives on the same origin, and the site number is the last
/// path segment.
export function parseSiteHref(href: string): JobSite {
	let match = SITE_HREF.exec(href)
	if (!match) {
		throw new Error(`not a Candidate Experience site url: "${href}"`)
	}

	let [, origin = '', siteNumber = ''] = match
	return {origin, siteNumber}
}

/// Built by hand rather than with `URLSearchParams`: react-native's URL support
/// is a from-scratch implementation, and this has to encode the finder's `;`
/// and `,` separators identically on device and under Jest.
function query(params: Array<[string, string]>): string {
	return params.map(([key, value]) => `${key}=${encodeURIComponent(value)}`).join('&')
}

function findReqs(site: JobSite, extra: string[]): string {
	return ['findReqs', [`siteNumber=${site.siteNumber}`, ...extra].join(',')].join(';')
}

export function categoriesUrl(site: JobSite): string {
	let params = query([
		['onlyData', 'true'],
		['expand', 'categoriesFacet'],
		['finder', findReqs(site, ['facetsList=CATEGORIES', 'limit=1'])],
	])

	return `${site.origin}${REQUISITIONS}?${params}`
}

const REQUISITION_LIMIT = 200

export function requisitionsUrl(site: JobSite, options: {categoryId?: number} = {}): string {
	let extra = [`limit=${REQUISITION_LIMIT}`, 'sortBy=POSTING_DATES_DESC']
	if (options.categoryId !== undefined) {
		extra.push(`selectedCategoriesFacet=${options.categoryId}`)
	}

	let params = query([
		['onlyData', 'true'],
		['expand', 'requisitionList'],
		['finder', findReqs(site, extra)],
	])

	return `${site.origin}${REQUISITIONS}?${params}`
}

export function detailUrl(site: JobSite, id: string): string {
	let params = query([
		['onlyData', 'true'],
		['expand', 'all'],
		['finder', `ById;Id=${id},siteNumber=${site.siteNumber}`],
	])

	return `${site.origin}${DETAILS}?${params}`
}

export function jobPageUrl(siteHref: string, id: string): string {
	return `${siteHref.replace(/\/$/u, '')}/job/${id}`
}
