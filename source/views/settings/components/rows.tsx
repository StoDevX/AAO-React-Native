import * as React from 'react'
import {Button, HStack, Image, Spacer, Text} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonStyle,
	contentShape,
	disabled as disabledModifier,
	foregroundColor,
	shapes,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

type RowProps = {
	title: string
	onPress: () => void
	disabled?: boolean
}

/**
 * A row that pushes another screen via React Navigation. `@expo/ui` has no
 * `NavigationLink` (it mounts its destination as a SwiftUI view inside a
 * SwiftUI `NavigationStack`, and this app pushes via React Navigation, so
 * there is no SwiftUI view for it to push to) so the chevron is drawn by
 * hand.
 */
export function NavigationRow(props: RowProps): React.ReactNode {
	let {title, onPress, disabled = false} = props

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(title),
				disabledModifier(disabled),
			]}
			onPress={onPress}
		>
			{/* contentShape belongs on the label (this HStack), not the Button:
			    SwiftUI derives a button's tappable region from its label, so
			    putting contentShape on the Button leaves only the text and
			    chevron tappable rather than the whole row. */}
			<HStack modifiers={[contentShape(shapes.rectangle())]}>
				<Text modifiers={[foregroundColor(c.label)]}>{title}</Text>
				<Spacer />
				<Image color={c.tertiaryLabel} size={14} systemName="chevron.right" />
			</HStack>
		</Button>
	)
}

/**
 * A row that fires an action (open a URL, show an alert, mutate) rather than
 * pushing a screen. Tinted text and no chevron, since there is nowhere to go.
 */
export function ActionRow(props: RowProps): React.ReactNode {
	let {title, onPress, disabled = false} = props

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(title),
				disabledModifier(disabled),
			]}
			onPress={onPress}
		>
			<HStack modifiers={[contentShape(shapes.rectangle())]}>
				<Text modifiers={[foregroundColor(c.systemBlue)]}>{title}</Text>
				<Spacer />
			</HStack>
		</Button>
	)
}
