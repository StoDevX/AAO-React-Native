import * as React from 'react'
import {MenuPickerRow} from '../../components/menu-picker-row'
import {useMessStore, type PhotoTone} from './store'

/** Names the picker, for a UI test. */
export const PHOTO_TONE_ID = 'photo-tone'

const TONES = [
	['auto', 'Automatic'],
	['color', 'Color'],
	['sepia', 'Sepia'],
] as const satisfies ReadonlyArray<readonly [PhotoTone, string]>

/**
 * How the issue thumbnails tint their lead photo: by the appearance, in Light Mode's tone in
 * both appearances, or in sepia.
 */
export function PhotoToneRow(): React.ReactNode {
	let tone = useMessStore((state) => state.photoTone)
	let setTone = useMessStore((state) => state.setPhotoTone)
	return (
		<MenuPickerRow
			id={PHOTO_TONE_ID}
			label="Front Page Photos"
			onSelectionChange={setTone}
			options={TONES}
			selection={tone}
		/>
	)
}
