import {describe, expect, it} from '@jest/globals'
import {registerCampusServer} from '@frogpond/api'

import {imageUrl, remoteImage} from '../remote-images'

describe('imageUrl', () => {
	it('asks the server the app is pointed at', () => {
		registerCampusServer('edu.stolaf', new URL('https://example.test/v1/'))

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
