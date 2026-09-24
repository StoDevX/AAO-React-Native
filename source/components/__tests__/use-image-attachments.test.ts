import {afterEach, describe, expect, it, jest} from '@jest/globals'
import {act, renderHook} from '@testing-library/react-native'
import {Alert} from 'react-native'
import * as ImagePicker from 'expo-image-picker'

import {downscaledSize, MAX_ATTACHMENTS, useImageAttachments} from '../use-image-attachments'

jest.mock('expo-image-picker', () => ({
	launchImageLibraryAsync: jest.fn(),
	UIImagePickerPreferredAssetRepresentationMode: {Compatible: 'compatible'},
}))
type ManipulatorContext = {
	resize: () => ManipulatorContext
	renderAsync: () => Promise<{saveAsync: () => Promise<{uri: string}>}>
}

const mockManipulate = jest.fn<(uri: string) => ManipulatorContext>()
jest.mock('expo-image-manipulator', () => ({
	ImageManipulator: {manipulate: (uri: string) => mockManipulate(uri)},
	SaveFormat: {JPEG: 'jpeg'},
}))

const mockPicker = ImagePicker.launchImageLibraryAsync as jest.MockedFunction<
	typeof ImagePicker.launchImageLibraryAsync
>

/** Stands in for the native re-encode, saving each image under a `.jpg` name. */
function reencodeTo(savedUri: (uri: string) => string) {
	mockManipulate.mockImplementation((uri) => {
		let context: ManipulatorContext = {
			resize: () => context,
			renderAsync: () => Promise.resolve({saveAsync: () => Promise.resolve({uri: savedUri(uri)})}),
		}
		return context
	})
}

function picked(...uris: Array<string>): ImagePicker.ImagePickerResult {
	return {canceled: false, assets: uris.map((uri) => ({uri, width: 4032, height: 3024}))}
}

describe('downscaledSize', () => {
	it('bounds a landscape photo by its width', () => {
		expect(downscaledSize(4032, 3024)).toEqual({width: 2048})
	})

	it('bounds a portrait photo by its height', () => {
		expect(downscaledSize(3024, 4032)).toEqual({height: 2048})
	})

	it('leaves an image that already fits at its own size', () => {
		expect(downscaledSize(1179, 2048)).toBeNull()
	})
})

describe('useImageAttachments', () => {
	afterEach(() => {
		jest.clearAllMocks()
		jest.restoreAllMocks()
	})

	it('adds the re-encoded copy of each picked image, not the original', async () => {
		reencodeTo((uri) => uri.replace('.heic', '.jpg'))
		mockPicker.mockResolvedValue(picked('file:///a.heic', 'file:///b.heic'))
		let {result} = await renderHook(() => useImageAttachments())

		await act(() => result.current.addImages())

		expect(result.current.images).toEqual([{uri: 'file:///a.jpg'}, {uri: 'file:///b.jpg'}])
	})

	it('offers only as many images as the report has room for', async () => {
		reencodeTo((uri) => uri)
		mockPicker.mockResolvedValueOnce(picked('file:///a.jpg'))
		let {result} = await renderHook(() => useImageAttachments())
		await act(() => result.current.addImages())

		mockPicker.mockResolvedValueOnce({canceled: true, assets: null})
		await act(() => result.current.addImages())

		expect(mockPicker.mock.calls[1][0]?.selectionLimit).toBe(MAX_ATTACHMENTS - 1)
	})

	it('asks the picker for a compatible representation, so a HEIC photo is transcoded', async () => {
		mockPicker.mockResolvedValue({canceled: true, assets: null})
		let {result} = await renderHook(() => useImageAttachments())

		await act(() => result.current.addImages())

		expect(mockPicker.mock.calls[0][0]?.preferredAssetRepresentationMode).toBe('compatible')
	})

	it('is busy until the picked images are ready, and opens one picker at a time', async () => {
		reencodeTo((uri) => uri)
		let finishPicking: (value: ImagePicker.ImagePickerResult) => void = () => undefined
		mockPicker.mockReturnValueOnce(
			new Promise((resolve) => {
				finishPicking = resolve
			}),
		)
		let {result} = await renderHook(() => useImageAttachments())

		let adding: Promise<void> = Promise.resolve()
		await act(() => {
			adding = result.current.addImages()
		})
		expect(result.current.picking).toBe(true)

		await act(() => result.current.addImages())
		expect(mockPicker).toHaveBeenCalledTimes(1)

		await act(async () => {
			finishPicking(picked('file:///a.jpg'))
			await adding
		})
		expect(result.current.picking).toBe(false)
		expect(result.current.images).toEqual([{uri: 'file:///a.jpg'}])
	})

	it('says so when a picked image cannot be loaded, and is no longer busy', async () => {
		mockPicker.mockRejectedValue(new Error('the photo is only in iCloud'))
		let alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined)
		let {result} = await renderHook(() => useImageAttachments())

		await act(() => result.current.addImages())

		expect(alert).toHaveBeenCalledWith('Could not add images', expect.any(String))
		expect(result.current.picking).toBe(false)
		expect(result.current.images).toEqual([])
	})

	it('removes an image by its uri', async () => {
		reencodeTo((uri) => uri)
		mockPicker.mockResolvedValue(picked('file:///a.jpg', 'file:///b.jpg'))
		let {result} = await renderHook(() => useImageAttachments())
		await act(() => result.current.addImages())

		await act(() => result.current.removeImage('file:///a.jpg'))

		expect(result.current.images).toEqual([{uri: 'file:///b.jpg'}])
	})
})
