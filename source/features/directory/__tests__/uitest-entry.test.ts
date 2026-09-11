import {UITEST_DIRECTORY_RESULTS, UITEST_ENTRY_NAME} from '../__fixtures__/entries'
import {formatResults} from '../helpers'

/// The fixture exists so the detail screen has every section to draw. A field
/// going missing would leave that section blank, and the screenshot would look
/// like an entry that simply lacked it.
describe('the UI test directory entry', () => {
	let [entry] = formatResults(UITEST_DIRECTORY_RESULTS.results)

	it('is the entry the tests search for', () => {
		expect(entry?.displayName).toBe(UITEST_ENTRY_NAME)
	})

	it('carries something for every section of the detail screen', () => {
		expect(entry?.pronouns?.length).toBeTruthy()
		expect(entry?.email).toBeTruthy()
		expect(entry?.officeHours).toBeTruthy()
		expect(entry?.profileUrl).toBeTruthy()
		expect(entry?.displayTitle).toBeTruthy()
	})

	/// More than one, so the heading reads DEPARTMENTS and the plural branch is
	/// the one being drawn.
	it('belongs to more than one department', () => {
		expect(entry?.departments.length).toBeGreaterThan(1)
	})

	it('has a room with a phone in it', () => {
		let [location] = entry?.campusLocations ?? []

		expect(location?.display).toBeTruthy()
		expect(location?.phone).toBeTruthy()
	})
})
