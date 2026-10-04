import {afterEach, describe, expect, it, jest} from '@jest/globals'
import {Image} from 'react-native'
import {setApiRoot} from '@frogpond/api'

import {imageUrl, prefetchImages, remoteImage} from '../remote-images'

describe('imageUrl', () => {
	it('asks the server the app is pointed at', () => {
		setApiRoot(new URL('https://example.test/v1/'))

		expect(imageUrl('streaming', 'ksto-wordmark')).toBe(
			'https://example.test/v1/images/streaming/ksto-wordmark.webp',
		)
		// kept once fetched: the picture's name changes when the picture does
		expect(remoteImage('contacts', 'sarn')).toStrictEqual({
			uri: 'https://example.test/v1/images/contacts/sarn.webp',
			cache: 'force-cache',
		})
	})
})

describe('prefetchImages', () => {
	afterEach(() => {
		jest.restoreAllMocks()
	})

	it('fetches each image once, and shrugs off one that fails', async () => {
		let prefetch = jest
			.spyOn(Image, 'prefetch')
			.mockRejectedValueOnce(new Error('offline'))
			.mockResolvedValue(true)

		// resolving, not rejecting, is the point: a failed fetch must not escape
		await expect(
			prefetchImages([
				'https://example.test/a.webp',
				'https://example.test/b.webp',
				'https://example.test/a.webp',
			]),
		).resolves.toBeUndefined()

		expect(prefetch).toHaveBeenCalledTimes(2)
		expect(prefetch).toHaveBeenNthCalledWith(2, 'https://example.test/b.webp')
	})
})
