import * as Sentry from '@sentry/react-native'
import {readAttachment} from '../attachments'

jest.mock('@sentry/react-native', () => ({getDataFromUri: jest.fn()}))

const mockGetData = Sentry.getDataFromUri as jest.MockedFunction<typeof Sentry.getDataFromUri>

describe('readAttachment', () => {
	it('reads the image into a JPEG attachment numbered from one', async () => {
		let data = new Uint8Array([1, 2, 3])
		mockGetData.mockResolvedValue(data)

		await expect(readAttachment({uri: 'file:///a.jpg'}, 1)).resolves.toEqual({
			filename: 'image-2.jpg',
			data,
			contentType: 'image/jpeg',
		})
	})

	it('fails rather than attach nothing when the file cannot be read', async () => {
		mockGetData.mockResolvedValue(null)

		await expect(readAttachment({uri: 'file:///gone.jpg'}, 0)).rejects.toThrow()
	})
})
