import {categoriesUrl, detailUrl, jobPageUrl, parseSiteHref, requisitionsUrl} from '../urls'

const HREF =
	'https://fa-ewur-saasfaprod1.fa.ocs.oraclecloud.com/hcmUI/CandidateExperience/en/sites/CX_1'

describe('parseSiteHref', () => {
	test('splits the origin from the site number', () => {
		expect(parseSiteHref(HREF)).toEqual({
			origin: 'https://fa-ewur-saasfaprod1.fa.ocs.oraclecloud.com',
			siteNumber: 'CX_1',
		})
	})

	test('tolerates a trailing slash', () => {
		expect(parseSiteHref(`${HREF}/`).siteNumber).toBe('CX_1')
	})

	test('an href that is not a candidate experience site throws', () => {
		expect(() => parseSiteHref('https://stolaf.edu/jobs')).toThrow(/candidate experience/iu)
	})
})

describe('url building', () => {
	const site = parseSiteHref(HREF)

	test('the categories url asks only for the facet', () => {
		const url = categoriesUrl(site)

		expect(url).toContain('/hcmRestApi/resources/latest/recruitingCEJobRequisitions?')
		expect(url).toContain('expand=categoriesFacet')
		expect(decodeURIComponent(url)).toContain('facetsList=CATEGORIES')
		expect(decodeURIComponent(url)).toContain('siteNumber=CX_1')
	})

	test('the requisitions url sorts by posting date', () => {
		expect(decodeURIComponent(requisitionsUrl(site))).toContain('sortBy=POSTING_DATES_DESC')
	})

	test('a category id filters the requisitions url', () => {
		expect(decodeURIComponent(requisitionsUrl(site, {categoryId: 42}))).toContain(
			'selectedCategoriesFacet=42',
		)
	})

	// The finder's own separators must survive encoding, or Oracle answers 400.
	test('the finder is percent-encoded', () => {
		expect(requisitionsUrl(site)).toContain('finder=findReqs%3BsiteNumber%3DCX_1')
	})

	test('the detail url finds one posting by id', () => {
		expect(decodeURIComponent(detailUrl(site, '2841'))).toContain('ById;Id=2841,siteNumber=CX_1')
	})

	test('the job page url is the public posting', () => {
		expect(jobPageUrl(HREF, '2841')).toBe(`${HREF}/job/2841`)
	})

	test('the job page url does not double a trailing slash', () => {
		expect(jobPageUrl(`${HREF}/`, '2841')).toBe(`${HREF}/job/2841`)
	})
})
