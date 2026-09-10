import * as React from 'react'
import {Button, HStack, Image, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonStyle,
	contentShape,
	disabled as disabledModifier,
	font,
	foregroundStyle,
	lineLimit,
	shapes,
	truncationMode,
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
			modifiers={[buttonStyle('plain'), accessibilityLabel(title), disabledModifier(disabled)]}
			onPress={onPress}
		>
			{/* contentShape belongs on the label (this HStack), not the Button:
			    SwiftUI derives a button's tappable region from its label, so
			    putting contentShape on the Button leaves only the text and
			    chevron tappable rather than the whole row. */}
			<HStack modifiers={[contentShape(shapes.rectangle())]}>
				<Text modifiers={[foregroundStyle(c.label)]}>{title}</Text>
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
			modifiers={[buttonStyle('plain'), accessibilityLabel(title), disabledModifier(disabled)]}
			onPress={onPress}
		>
			<HStack modifiers={[contentShape(shapes.rectangle())]}>
				<Text modifiers={[foregroundStyle(c.systemBlue)]}>{title}</Text>
				<Spacer />
			</HStack>
		</Button>
	)
}

type DisclosureRowProps = {
	title: string
	/** A second, quieter line under the title. Omitted entirely when absent, so
	 * a row without one is a single line rather than a line and a gap. */
	detail?: string
	/** How many lines the title may wrap to before it truncates. */
	titleLines?: number
	onPress: () => void
}

/**
 * The list row this app repeats most: a title, an optional detail line, and a
 * disclosure chevron. Shared rather than repeated per screen because the
 * `contentShape` placement below is easy to get wrong and impossible to catch
 * in Jest -- see [[NavigationRow]] for why the chevron is drawn by hand.
 */
export function DisclosureRow(props: DisclosureRowProps): React.ReactNode {
	let {title, detail, titleLines = 1, onPress} = props

	return (
		<Button
			modifiers={[buttonStyle('plain'), accessibilityLabel(detail ? `${title}, ${detail}` : title)]}
			onPress={onPress}
		>
			{/* contentShape on the label, not the Button -- see NavigationRow. */}
			<HStack modifiers={[contentShape(shapes.rectangle())]} spacing={8}>
				<VStack alignment="leading" spacing={2}>
					<Text
						modifiers={[foregroundStyle(c.label), lineLimit(titleLines), truncationMode('tail')]}
					>
						{title}
					</Text>
					{detail ? (
						<Text modifiers={[font({textStyle: 'subheadline'}), foregroundStyle(c.secondaryLabel)]}>
							{detail}
						</Text>
					) : null}
				</VStack>
				<Spacer />
				<Image color={c.tertiaryLabel} size={14} systemName="chevron.right" />
			</HStack>
		</Button>
	)
}
