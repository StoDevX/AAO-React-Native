import {attachmentFilename} from '../attachments'

describe('attachmentFilename', () => {
	it("keeps the photo library's own name", () => {
		expect(attachmentFilename({fileName: 'IMG_0042.jpg', mimeType: 'image/jpeg'}, 0)).toBe(
			'IMG_0042.jpg',
		)
	})

	it('numbers an unnamed image from one, with an extension from its type', () => {
		expect(attachmentFilename({fileName: null, mimeType: 'image/png'}, 1)).toBe('image-2.png')
	})

	it('falls back to jpg when the type is unknown', () => {
		expect(attachmentFilename({}, 0)).toBe('image-1.jpg')
	})
})
