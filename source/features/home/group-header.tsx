import * as React from 'react'
import {Button, HStack, Image, Spacer, Text} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityIdentifier,
	accessibilityLabel,
	accessibilityValue,
	buttonStyle,
	contentShape,
	font,
	foregroundStyle,
	frame,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import {FILL_WIDTH} from '../../components/tile-layout'

/// The minimum touch target, and so the header's height even at small text sizes.
const MIN_HEIGHT = 44

const TITLE_MODIFIERS = [font({textStyle: 'title3', weight: 'bold'}), foregroundStyle(c.label)]

type Props = {
	title: string
	/** Names the header for a UI test. */
	accessibilityId: string
	/** Absent for a group that always stays open. */
	onToggle?: () => void
	collapsed: boolean
}

/**
 * A home group's title. For a group that collapses, the whole row is a button
 * that folds the tiles away.
 */
export function HomeGroupHeader({
	title,
	accessibilityId,
	onToggle,
	collapsed,
}: Props): React.ReactNode {
	if (!onToggle) {
		return (
			<HStack
				modifiers={[
					frame({maxWidth: FILL_WIDTH, minHeight: MIN_HEIGHT, alignment: 'leading'}),
					accessibilityAddTraits(['isHeader']),
					accessibilityIdentifier(accessibilityId),
				]}
			>
				<Text modifiers={TITLE_MODIFIERS}>{title}</Text>
				<Spacer />
			</HStack>
		)
	}

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(title),
				accessibilityValue(collapsed ? 'Collapsed' : 'Expanded'),
				accessibilityAddTraits(['isHeader']),
				accessibilityIdentifier(accessibilityId),
			]}
			onPress={onToggle}
		>
			<HStack
				modifiers={[
					frame({maxWidth: FILL_WIDTH, minHeight: MIN_HEIGHT}),
					// without this only the title and chevron respond to a tap; the
					// space between them is not hit-tested
					contentShape(shapes.rectangle()),
				]}
				spacing={8}
			>
				<Text modifiers={TITLE_MODIFIERS}>{title}</Text>
				<Spacer />
				<Image
					modifiers={[
						font({textStyle: 'subheadline', weight: 'semibold'}),
						foregroundStyle(c.tertiaryLabel),
					]}
					systemName={collapsed ? 'chevron.right' : 'chevron.down'}
				/>
			</HStack>
		</Button>
	)
}
