import * as React from 'react'
import {afterEach, describe, expect, jest, test} from '@jest/globals'
import {fireEvent, render, screen} from '@testing-library/react-native'

import {PhotoViewerModal} from '../photo-viewer-modal'
import {loadBeforeTests} from '../../../../testing/load-before-tests'

loadBeforeTests('Modal')

// The library's own stand-in: zero insets, where the real hook needs a native provider.
jest.mock(
	'react-native-safe-area-context',
	() =>
		// oxlint-disable-next-line typescript/no-require-imports
		require('react-native-safe-area-context/jest/mock').default,
)

const mockShareImage = jest.fn<(uri: string) => Promise<void>>()
jest.mock('../../../../components/lib/share-image', () => ({
	shareImage: (uri: string) => mockShareImage(uri),
}))

const PHOTO = 'https://example.com/holland.jpg'

afterEach(() => {
	jest.clearAllMocks()
})

describe('PhotoViewerModal', () => {
	test("shares the building's photo on Share", async () => {
		mockShareImage.mockResolvedValue(undefined)
		await render(
			<PhotoViewerModal
				label="Photo of Holland Hall"
				onClose={jest.fn()}
				uri={PHOTO}
				visible={true}
			/>,
		)

		fireEvent.press(screen.getByRole('button', {name: 'Share'}))

		expect(mockShareImage).toHaveBeenCalledWith(PHOTO)
	})
})
