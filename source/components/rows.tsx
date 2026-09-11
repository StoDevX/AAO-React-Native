import * as React from 'react'
import {
	Image as RNImage,
	StyleSheet,
	TextInput as RNTextInput,
	useWindowDimensions,
} from 'react-native'
import type {ColorValue} from 'react-native'
import type {SFSymbol} from 'sf-symbols-typescript'
import {
	Button,
	HStack,
	Image,
	LabeledContent,
	RNHostView,
	Spacer,
	Text,
	VStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityIdentifier,
	accessibilityLabel,
	buttonStyle,
	contentShape,
	disabled as disabledModifier,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	multilineTextAlignment,
	shapes,
	truncationMode,
} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'

import {detailLinesOf, rowLabel, type RowDetail} from './lib/row-text'

type RowProps = {
	title: string
	onPress: () => void
	disabled?: boolean
}

type ActionRowProps = RowProps & {
	/** Draws the action in red, for one that destroys something. */
	destructive?: boolean
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
export function ActionRow(props: ActionRowProps): React.ReactNode {
	let {title, onPress, disabled = false, destructive = false} = props

	return (
		<Button
			modifiers={[buttonStyle('plain'), accessibilityLabel(title), disabledModifier(disabled)]}
			onPress={onPress}
		>
			<HStack modifiers={[contentShape(shapes.rectangle())]}>
				<Text modifiers={[foregroundStyle(destructive ? c.systemRed : c.systemBlue)]}>{title}</Text>
				<Spacer />
			</HStack>
		</Button>
	)
}

/**
 * A leading symbol, drawn by SwiftUI itself.
 */
type SymbolImage = {systemName: SFSymbol; tint?: ColorValue}

/**
 * A leading thumbnail fetched over the network. `@expo/ui`'s own `Image` reads
 * only SF Symbols, asset-catalog names and local files, so this is a React
 * Native image hosted inside the SwiftUI row -- which needs its size stated
 * up front, since `RNHostView` gives a hosted view no bounds of its own.
 */
type ThumbnailImage = {uri: string; width: number; height: number}

export type DisclosureRowImage = SymbolImage | ThumbnailImage

/// Mirrored by `TestIdentifiers.Rows.thumbnail`.
const THUMBNAIL_ID = 'disclosure-row-thumbnail'

const SYMBOL_SIZE = 20

type DisclosureRowProps = {
	title: string
	/**
	 * One or more quieter lines under the title. Entries that are absent or
	 * blank are dropped rather than drawn, so a caller can build the array
	 * straight from optional fields without filtering first.
	 */
	detail?: RowDetail
	/** How many lines the title may wrap to before it truncates. */
	titleLines?: number
	/** How many lines each detail line may wrap to. Unbounded by default. */
	detailLines?: number
	/** A symbol or thumbnail at the leading edge. */
	image?: DisclosureRowImage
	/**
	 * An accessibility identifier for the row, for a UI test to find it by.
	 * A label is built from the title and details, which a screen showing
	 * arbitrary data cannot guarantee is unique.
	 */
	identifier?: string
	onPress: () => void
}

function LeadingImage({image}: {image: DisclosureRowImage}): React.ReactNode {
	if ('systemName' in image) {
		return (
			<Image
				color={image.tint ?? c.secondaryLabel}
				size={SYMBOL_SIZE}
				systemName={image.systemName}
			/>
		)
	}

	return (
		<HStack modifiers={[frame({width: image.width, height: image.height})]}>
			<RNHostView matchContents={false}>
				<RNImage
					accessibilityIgnoresInvertColors={true}
					source={{uri: image.uri}}
					style={[styles.thumbnail, {width: image.width, height: image.height}]}
					testID={THUMBNAIL_ID}
				/>
			</RNHostView>
		</HStack>
	)
}

/**
 * The list row this app repeats most: an optional leading image, a title, any
 * number of quieter detail lines, and a disclosure chevron. Shared rather than
 * repeated per screen because the `contentShape` placement below is easy to get
 * wrong and impossible to catch in Jest -- see [[NavigationRow]] for why the
 * chevron is drawn by hand.
 */
export function DisclosureRow(props: DisclosureRowProps): React.ReactNode {
	let {title, detail, titleLines = 1, detailLines, image, identifier, onPress} = props

	let details = detailLinesOf(detail)
	let detailModifiers = [
		font({textStyle: 'subheadline'}),
		foregroundStyle(c.secondaryLabel),
		...(detailLines ? [lineLimit(detailLines), truncationMode('tail')] : []),
	]

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(rowLabel(title, detail)),
				...(identifier ? [accessibilityIdentifier(identifier)] : []),
			]}
			onPress={onPress}
		>
			{/* contentShape on the label, not the Button -- see NavigationRow. */}
			<HStack modifiers={[contentShape(shapes.rectangle())]} spacing={12}>
				{image ? <LeadingImage image={image} /> : null}
				<VStack alignment="leading" spacing={2}>
					<Text
						modifiers={[foregroundStyle(c.label), lineLimit(titleLines), truncationMode('tail')]}
					>
						{title}
					</Text>
					{details.map((line) => (
						<Text key={line} modifiers={detailModifiers}>
							{line}
						</Text>
					))}
				</VStack>
				<Spacer />
				<Image color={c.tertiaryLabel} size={14} systemName="chevron.right" />
			</HStack>
		</Button>
	)
}

const styles = StyleSheet.create({
	thumbnail: {
		resizeMode: 'cover',
		// Enough to take the hard corners off a cropped photo without reading
		// as a deliberately rounded avatar.
		borderRadius: 4,
	},
	selectableText: {
		color: c.label,
		paddingVertical: 4,
	},
})

type DetailRowProps = {
	/** The quieter half: what this value is. */
	label: string
	/** The value itself. */
	value: string
	/** How many lines the value may wrap to. Unbounded by default. */
	valueLines?: number
	/** Makes the row tappable, and draws a chevron to say so. */
	onPress?: () => void
}

/**
 * A label and its value, side by side -- the shape most of the detail screens
 * are made of.
 *
 * `LabeledContent` is SwiftUI's own, so the two halves align with every other
 * row in the list and follow the platform's own emphasis rather than ours.
 */
export function DetailRow(props: DetailRowProps): React.ReactNode {
	let {label, value, valueLines, onPress} = props

	let content = (
		<LabeledContent label={label}>
			<HStack spacing={6}>
				<Text
					modifiers={[
						foregroundStyle(c.secondaryLabel),
						multilineTextAlignment('trailing'),
						...(valueLines ? [lineLimit(valueLines)] : []),
					]}
				>
					{value}
				</Text>
				{onPress ? <Image color={c.tertiaryLabel} size={14} systemName="chevron.right" /> : null}
			</HStack>
		</LabeledContent>
	)

	if (!onPress) {
		return content
	}

	return (
		<Button
			modifiers={[buttonStyle('plain'), accessibilityLabel(`${label}, ${value}`)]}
			onPress={onPress}
		>
			{/* contentShape on the label, not the Button -- see NavigationRow. */}
			<HStack modifiers={[contentShape(shapes.rectangle())]}>{content}</HStack>
		</Button>
	)
}

/// Mirrored by `TestIdentifiers.Rows.selectableText`.
const SELECTABLE_TEXT_ID = 'selectable-text'

/**
 * A block of text a reader can select, and whose phone numbers, addresses,
 * links and dates iOS turns into things they can tap.
 *
 * A React Native `TextInput` rather than an `@expo/ui` `Text`: SwiftUI's
 * `textSelection` gives selection but no data detectors, and losing those would
 * make an org's meeting time or a course's room number unactionable.
 *
 * `dataDetectorTypes="all"` detects nothing under the new architecture --
 * `UIDataDetectorTypeAll` is `NSUIntegerMax`, which React Native reads through
 * `unsignedIntValue` and truncates to 32 bits -- so the types are spelled out.
 * See https://github.com/facebook/react-native/issues/55367.
 */
const DETECTED_TYPES: React.ComponentProps<typeof RNTextInput>['dataDetectorTypes'] = [
	'calendarEvent',
	'link',
	'phoneNumber',
	'address',
]

/**
 * What an inset-grouped row leaves for its content: the list's own margin
 * either side of the card, and the card's padding either side of the row.
 *
 * Stated rather than measured because a hosted view reports its own intrinsic
 * size, and a paragraph's intrinsic width is however long its longest line
 * would be unwrapped -- far wider than the row, so it drew clipped at both
 * edges until given a width to wrap to.
 */
const LIST_MARGIN = 20
const ROW_PADDING = 16
const ROW_CONTENT_INSET = (LIST_MARGIN + ROW_PADDING) * 2

export function SelectableText({text}: {text: string}): React.ReactNode {
	let {width: screenWidth} = useWindowDimensions()

	return (
		<RNHostView matchContents={true}>
			<RNTextInput
				dataDetectorTypes={DETECTED_TYPES}
				editable={false}
				multiline={true}
				scrollEnabled={false}
				style={[styles.selectableText, {width: screenWidth - ROW_CONTENT_INSET}]}
				testID={SELECTABLE_TEXT_ID}
				value={text}
			/>
		</RNHostView>
	)
}
