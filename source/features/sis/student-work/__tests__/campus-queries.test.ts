import {afterEach, beforeEach, describe, expect, test} from '@jest/globals'
import {registerCampusServer, setFetchInterceptor} from '@frogpond/api'
import {jobDetailOptions, jobPostingsOptions, postingUnitsOptions} from '@frogpond/ccc-jobs'
import {setManifestServer} from '@frogpond/data-sources'
import {QueryClient} from '@tanstack/react-query'

import {installCampusFixtures} from '../../../campus/fixtures'
import {useCampusStore} from '../../../campus/store'
import {queryClient as appQueryClient} from '../../../../init/tanstack-query'
import {studentWorkAreasOptions} from '../areas-query'
import {studentWagesOptions} from '../wages-query'

let client: QueryClient

beforeEach(() => {
	useCampusStore.setState({campus: 'example.college'})
	// The manifest comes from St. Olaf's server, as in the app; Wiki Monkeys' fixtures answer it.
	setManifestServer('edu.stolaf')
	registerCampusServer('edu.stolaf', new URL('https://stolaf.example.invalid/'))
	registerCampusServer('example.college', new URL('https://example.college.invalid/'))
	installCampusFixtures('example.college', 'serve')
	client = new QueryClient({defaultOptions: {queries: {retry: false}}})
})
afterEach(() => {
	useCampusStore.setState(useCampusStore.getInitialState())
	client.clear()
	// The manifest is cached on the app's own client, whose collection timer would hold Jest open.
	appQueryClient.clear()
	setFetchInterceptor(null)
})

const WRAPPING_JOB = 'Undergraduate Research Assistant'

// UI tests read a campus's Student Work from its own sources, as the app does, which a
// campus's fixtures answer; no bundled board or areas stand in for them.
describe("a campus's Student Work", () => {
	test('sorts into its own areas', async () => {
		let areas = await client.query(studentWorkAreasOptions)
		expect(areas.map((area) => area.name)).toContain('Ski Patrol & Recreation')
	})

	test('pays its own wages', async () => {
		let wages = await client.query(studentWagesOptions)
		expect(wages.ST[1]).toBe(14)
	})

	test("lists its own board's postings, long enough to scroll", async () => {
		let categories = await client.query(jobPostingsOptions)
		let jobs = categories.flatMap((category) => category.jobs)
		expect(jobs.map((job) => job.title)).toContain(WRAPPING_JOB)
		expect(jobs.length).toBeGreaterThanOrEqual(20)
		expect(new Set(jobs.map((job) => job.location))).toEqual(new Set(['Norway Valley']))
	})

	test('opens a posting to a field long enough to wrap and its description', async () => {
		let categories = await client.query(jobPostingsOptions)
		let job = categories
			.flatMap((category) => category.jobs)
			.find((each) => each.title === WRAPPING_JOB)
		let detail = await client.query(jobDetailOptions(job?.id ?? ''))
		let contact = detail.fields.find((field) => field.label === 'Contact')?.value ?? ''
		expect(contact.length).toBeGreaterThan(40)
		expect(contact).toContain('Glaciology')
		expect(detail.body).toContain('**Transferable Skills:**')
	})

	test('opens every posting on its board, each to its own title', async () => {
		let categories = await client.query(jobPostingsOptions)
		for (let job of categories.flatMap((category) => category.jobs)) {
			let detail = await client.query(jobDetailOptions(job.id))
			expect(detail.title).toBe(job.title)
		}
	})

	test('files every posting under one of its areas', async () => {
		let categories = await client.query(jobPostingsOptions)
		let units = await client.query(postingUnitsOptions)
		let areas = await client.query(studentWorkAreasOptions)
		let known = new Set(areas.flatMap((area) => area.units))
		for (let job of categories.flatMap((category) => category.jobs)) {
			expect(known.has(units[job.id] ?? '')).toBe(true)
		}
	})
})
