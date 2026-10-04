import * as React from 'react'
import {HStack, Text, VStack} from '@expo/ui/swift-ui'
import {font, foregroundStyle, frame} from '@expo/ui/swift-ui/modifiers'
import {SYSTEM_TYPEFACE, type Typeface} from '../../components/lib/typeface'
import {PersonPhoto, type PersonPhotoSubject} from './person-photo'

type Props = {
	/** Whose photo, or initials, the header draws. Its `displayName` is the name shown. */
	person: PersonPhotoSubject
	/** The line under the name, such as their title, when they have one. */
	subtitle?: string | null
	/** The type the name and title are set in, for a page on a background of its own. */
	typeface?: Typeface
}

/**
 * The top of a person's page: their name and title beside their photo. The college directory's
 * page and the Messenger's staff page both draw it, so the two stay one layout.
 */
export function PersonHeader({
	person,
	subtitle,
	typeface = SYSTEM_TYPEFACE,
}: Props): React.ReactNode {
	let name = [
		font({textStyle: 'title2', weight: 'semibold', design: typeface.design}),
		foregroundStyle(typeface.label),
	]
	let subtitleModifiers = [
		font({textStyle: 'subheadline', design: typeface.design}),
		foregroundStyle(typeface.secondaryLabel),
	]

	return (
		// Name leading, photo trailing, both hung from the top -- so a long name wraps down the
		// left of the photo rather than pushing it about. The VStack fills what the photo leaves,
		// which is what gives the name somewhere to wrap within.
		<HStack alignment="top" spacing={12}>
			<VStack alignment="leading" modifiers={NAME_COLUMN} spacing={2}>
				<Text modifiers={name}>{person.displayName}</Text>
				{subtitle ? <Text modifiers={subtitleModifiers}>{subtitle}</Text> : null}
			</VStack>
			<PersonPhoto person={person} width={PHOTO_WIDTH} />
		</HStack>
	)
}

/** The photo's height follows from `TILE_ASPECT`, so the crop here and the crop on a grid's tile are the same picture. */
const PHOTO_WIDTH = 80

const NAME_COLUMN = [frame({maxWidth: Infinity, alignment: 'leading'})]
