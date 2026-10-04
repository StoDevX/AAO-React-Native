import * as React from 'react'
import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {act, fireEvent, render, screen} from '@testing-library/react-native'
import {openUrl} from '@frogpond/open-url'

import {remoteImage} from '../../../lib/remote-images'

import {NewsList} from '../news-list'
import type {StoryType} from '../types'

jest.mock('@frogpond/open-url', () => ({openUrl: jest.fn()}))

const STORY: StoryType = {
	authors: [],
	categories: [],
	content: '',
	excerpt: 'excerpt',
	link: 'https://wp.stolaf.edu/news/a-story/',
	title: 'A College story',
}

const QUERY = {isLoading: false, isError: false, refetch: () => Promise.resolve()}

afterEach(() => {
	jest.clearAllMocks()
})

function renderList(
	onPressStory?: (story: StoryType) => void,
	thumbnail: false | ReturnType<typeof remoteImage> = false,
) {
	return render(
		<NewsList
			entries={[STORY]}
			onPressStory={onPressStory}
			query={QUERY}
			selectedCategory={null}
			thumbnail={thumbnail}
		/>,
	)
}

describe('NewsList', () => {
	test('opens a story in the browser when the app has no reader for it', async () => {
		await renderList()

		fireEvent.press(screen.getByText('A College story'))

		expect(openUrl).toHaveBeenCalledWith('https://wp.stolaf.edu/news/a-story/')
	})

	test('hands a story to the reader instead of the browser when it has one', async () => {
		let onPressStory = jest.fn()
		await renderList(onPressStory)

		fireEvent.press(screen.getByText('A College story'))

		expect(onPressStory).toHaveBeenCalledWith(STORY)
		expect(openUrl).not.toHaveBeenCalled()
	})

	test('keeps two stories that share a title apart', async () => {
		// A Mess column names every week's post "Horoscopes"; only its link sets it apart.
		let first = {...STORY, title: 'Horoscopes', link: 'https://olafmessenger.com/horoscopes/'}
		let second = {...STORY, title: 'Horoscopes', link: 'https://olafmessenger.com/horoscopes-2/'}
		let consoleError = jest.spyOn(console, 'error').mockImplementation(() => undefined)

		try {
			await render(
				<NewsList
					entries={[first, second]}
					query={QUERY}
					selectedCategory={null}
					thumbnail={false}
				/>,
			)

			expect(screen.getAllByText('Horoscopes')).toHaveLength(2)
			expect(consoleError).not.toHaveBeenCalled()
		} finally {
			consoleError.mockRestore()
		}
	})

	// The source's thumbnail is fetched, so it can fail; the row then goes
	// without one rather than keeping an empty frame.
	test('drops the thumbnail when it cannot be fetched', async () => {
		await renderList(undefined, remoteImage('news-sources', 'stolaf'))
		expect(screen.getByTestId('news-thumbnail')).toBeTruthy()

		await act(() => {
			fireEvent(screen.getByTestId('news-thumbnail'), 'error')
		})

		expect(screen.queryByTestId('news-thumbnail')).toBeNull()
	})
})
