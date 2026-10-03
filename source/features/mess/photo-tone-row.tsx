import * as React from 'react'
import {Picker, Text} from '@expo/ui/swift-ui'
import {accessibilityIdentifier, pickerStyle, tag} from '@expo/ui/swift-ui/modifiers'
import {useMessStore, type PhotoTone} from './store'

/** Names the picker, for a UI test. */
export const PHOTO_TONE_ID = 'photo-tone'

const TONES: Array<[PhotoTone, string]> = [
	['auto', 'Automatic'],
	['color', 'Color'],
	['sepia', 'Sepia'],
]

/** How the issue thumbnails tint their lead photo: by the appearance, in full color, or in sepia. */
export function PhotoToneRow(): React.ReactNode {
	let tone = useMessStore((state) => state.photoTone)
	let setTone = useMessStore((state) => state.setPhotoTone)
	return (
		<Picker<PhotoTone>
			label="Front Page Photos"
			modifiers={[pickerStyle('menu'), accessibilityIdentifier(PHOTO_TONE_ID)]}
			onSelectionChange={setTone}
			selection={tone}
		>
			{TONES.map(([value, name]) => (
				<Text key={value} modifiers={[tag(value)]}>
					{name}
				</Text>
			))}
		</Picker>
	)
}
