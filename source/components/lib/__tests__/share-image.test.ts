import {Share} from 'react-native'
import {shareAsync} from 'expo-sharing'
import {afterEach, describe, expect, jest, test} from '@jest/globals'

const mockDownload =
	jest.fn<(url: string, destination: unknown, options: unknown) => Promise<{uri: string}>>()
jest.mock('expo-file-system', () => ({
	Paths: {cache: 'caches'},
	File: {
		downloadFileAsync: (url: string, destination: unknown, options: unknown) =>
			mockDownload(url, destination, options),
	},
}))

import {shareImage} from '../share-image'
import {shareImage as shareImageOnAndroid} from '../share-image.android'
import {loadBeforeTests} from '../../../testing/load-before-tests'

loadBeforeTests('Share')

afterEach(() => {
	jest.restoreAllMocks()
	mockDownload.mockReset()
})

describe('shareImage', () => {
	test('downloads a web image to the cache and shares the file, not its address', async () => {
		let share = jest
			.spyOn(Share, 'share')
			.mockResolvedValue({action: 'sharedAction', activityType: undefined})
		mockDownload.mockResolvedValue({uri: 'file:///caches/page.png'})

		await shareImage('https://olafmessenger.com/page.png')

		expect(mockDownload).toHaveBeenCalledWith('https://olafmessenger.com/page.png', 'caches', {
			idempotent: true,
		})
		expect(share).toHaveBeenCalledWith({url: 'file:///caches/page.png'})
	})

	test('shares an image already on the device as it is', async () => {
		let share = jest
			.spyOn(Share, 'share')
			.mockResolvedValue({action: 'sharedAction', activityType: undefined})

		await shareImage('file:///photos/page.png')

		expect(mockDownload).not.toHaveBeenCalled()
		expect(share).toHaveBeenCalledWith({url: 'file:///photos/page.png'})
	})

	// React Native's Share sends Android only text, so a file goes through expo-sharing there.
	test('shares the file itself through expo-sharing on Android', async () => {
		let share = jest.spyOn(Share, 'share')
		mockDownload.mockResolvedValue({uri: 'file:///caches/page.png'})

		await shareImageOnAndroid('https://olafmessenger.com/page.png')

		expect(shareAsync).toHaveBeenCalledWith('file:///caches/page.png', {mimeType: 'image/*'})
		expect(share).not.toHaveBeenCalled()
	})
})
