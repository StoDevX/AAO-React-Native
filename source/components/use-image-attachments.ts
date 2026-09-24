import * as React from 'react'
import {Alert} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import {ImageManipulator, SaveFormat} from 'expo-image-manipulator'

/** The most images one report carries. */
export const MAX_ATTACHMENTS = 3

/**
 * The longest edge, in pixels, an attached image keeps. Plenty to read a
 * screenshot or a posted sign by, and small enough -- a few hundred KB as JPEG
 * -- that three of them do not stall the JS thread while a report is sent.
 */
const LONG_EDGE = 2048

/** How hard the re-encoded JPEG is compressed. */
const JPEG_QUALITY = 0.7

/** A picked image, re-encoded to a small JPEG and waiting to be sent. */
export type PickedImage = {uri: string}

/**
 * The resize that brings an image's longer edge down to [[LONG_EDGE]], or
 * `null` when it already fits.
 */
export function downscaledSize(
	width: number,
	height: number,
): {width: number} | {height: number} | null {
	if (Math.max(width, height) <= LONG_EDGE) {
		return null
	}

	return width >= height ? {width: LONG_EDGE} : {height: LONG_EDGE}
}

/**
 * Writes a picked image out again as a downscaled JPEG. Every image goes
 * through this, even one already small enough: the JPEG is encoded from pixels
 * alone, so the photo's EXIF -- its location above all -- is left behind.
 */
async function reencode(asset: ImagePicker.ImagePickerAsset): Promise<PickedImage> {
	let context = ImageManipulator.manipulate(asset.uri)
	let size = downscaledSize(asset.width, asset.height)
	if (size) {
		context.resize(size)
	}

	let image = await context.renderAsync()
	let saved = await image.saveAsync({format: SaveFormat.JPEG, compress: JPEG_QUALITY})
	return {uri: saved.uri}
}

export type ImageAttachments = {
	images: Array<PickedImage>
	/**
	 * True from opening the photo library until the picked images are ready.
	 * The picker closes before it has finished loading them -- an iCloud photo
	 * may still be downloading -- so a report sent in that gap would go
	 * without them.
	 */
	picking: boolean
	addImages: () => Promise<void>
	removeImage: (uri: string) => void
}

/** The images attached to a problem report, and picking more of them. */
export function useImageAttachments(): ImageAttachments {
	let [images, setImages] = React.useState<Array<PickedImage>>([])
	let [picking, setPicking] = React.useState(false)

	// A ref, not the state above: a second tap can land before the render
	// that would have disabled the button.
	let pickingNow = React.useRef(false)

	let addImages = React.useCallback(async () => {
		if (pickingNow.current) {
			return
		}
		pickingNow.current = true
		setPicking(true)

		try {
			let result = await ImagePicker.launchImageLibraryAsync({
				mediaTypes: ['images'],
				allowsMultipleSelection: true,
				selectionLimit: MAX_ATTACHMENTS - images.length,
				// Hands a HEIC photo over as JPEG rather than as its original bytes.
				preferredAssetRepresentationMode:
					ImagePicker.UIImagePickerPreferredAssetRepresentationMode.Compatible,
			})

			if (result.canceled) {
				return
			}

			let reencoded = await Promise.all(result.assets.map(reencode))
			setImages((current) => [...current, ...reencoded])
		} catch {
			Alert.alert(
				'Could not add images',
				'A photo could not be loaded. If it is stored in iCloud, check your connection and try again.',
			)
		} finally {
			pickingNow.current = false
			setPicking(false)
		}
	}, [images.length])

	let removeImage = React.useCallback((uri: string) => {
		setImages((current) => current.filter((image) => image.uri !== uri))
	}, [])

	return {images, picking, addImages, removeImage}
}
