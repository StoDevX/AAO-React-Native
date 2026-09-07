import {describe, expect, it} from '@jest/globals'
import type {StoryType} from '../../types'
import {combineNewsResults, type NewsFeedQuery} from '../combine'

let story = (props: Partial<StoryType>): StoryType => ({
	authors: [],
	categories: [],
	content: '',
	excerpt: 'excerpt',
	title: 'title',
	...props,
})

let query = (props: Partial<NewsFeedQuery>): NewsFeedQuery => ({
	isLoading: false,
	isError: false,
	refetch: () => Promise.resolve(),
	...props,
})

describe('combineNewsResults', () => {
	it('should key each source by id, in the order the queries were given', () => {
		let results = [
			query({data: [story({title: 'first'})]}),
			query({data: [story({title: 'second'})]}),
		]
		let {entriesBySource} = combineNewsResults(['stolaf', 'mess'], results)
		expect(entriesBySource['stolaf']?.map((s) => s.title)).toStrictEqual(['first'])
		expect(entriesBySource['mess']?.map((s) => s.title)).toStrictEqual(['second'])
	})

	it('should clean the entries it hands back', () => {
		let stories = [story({title: 'kept'}), story({content: '<form>', title: 'dropped'})]
		let {entriesBySource} = combineNewsResults(['stolaf'], [query({data: stories})])
		expect(entriesBySource['stolaf']?.map((s) => s.title)).toStrictEqual(['kept'])
	})

	it('should take categories from the cleaned entries only', () => {
		let dropped = story({categories: ['Sports'], content: '<form>', title: 'dropped'})
		let {categoriesBySource} = combineNewsResults(['stolaf'], [query({data: [dropped]})])
		expect(categoriesBySource['stolaf']).toStrictEqual([])
	})

	it('should give a source with no data an empty feed', () => {
		let {entriesBySource, categoriesBySource} = combineNewsResults(['stolaf'], [query({})])
		expect(entriesBySource['stolaf']).toStrictEqual([])
		expect(categoriesBySource['stolaf']).toStrictEqual([])
	})

	it('should hand back the query behind each source', () => {
		let stolaf = query({isLoading: true})
		let {queryBySource} = combineNewsResults(['stolaf'], [stolaf])
		expect(queryBySource['stolaf']).toBe(stolaf)
	})

	it('should name the sources whose fetch failed', () => {
		let results = [query({isError: true}), query({data: [story({})]})]
		let {unavailableSources} = combineNewsResults(['stolaf', 'mess'], results)
		expect(unavailableSources).toStrictEqual(['stolaf'])
	})
})
