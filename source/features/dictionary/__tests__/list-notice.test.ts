import {listNotice} from '../lib/list-notice'

const LOADED = {isError: false, isLoading: false, groupCount: 1, query: ''}

describe('listNotice', () => {
	it('shows the list once there are entries', () => {
		expect(listNotice(LOADED)).toEqual({kind: 'list'})
	})

	it('chooses the error notice over the list', () => {
		expect(listNotice({...LOADED, isError: true})).toEqual({kind: 'error'})
	})

	// A refetch that fails while entries are already on screen still has
	// entries to show, but the reader has to be told the refresh went wrong.
	it('chooses the error notice over the list even when entries are loaded', () => {
		expect(listNotice({...LOADED, isError: true, groupCount: 3})).toEqual({kind: 'error'})
	})

	it('spins rather than saying there is nothing, while the first load runs', () => {
		expect(listNotice({...LOADED, isLoading: true, groupCount: 0})).toEqual({kind: 'loading'})
	})

	// An error during a refetch arrives with `isLoading` still set; the error
	// is the news, not the spinner.
	it('prefers the error notice to the spinner', () => {
		expect(listNotice({...LOADED, isError: true, isLoading: true, groupCount: 0})).toEqual({
			kind: 'error',
		})
	})

	// Naming the query is what separates "we have no such word" from "the
	// dictionary is empty", and the reader typed it.
	it('names the query when a search found nothing', () => {
		expect(listNotice({...LOADED, groupCount: 0, query: 'zzz'})).toEqual({
			kind: 'empty',
			title: 'No results for “zzz”',
		})
	})

	it('says only that there are no results when nothing was searched for', () => {
		expect(listNotice({...LOADED, groupCount: 0})).toEqual({kind: 'empty', title: 'No results'})
	})
})
