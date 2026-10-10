import * as React from 'react'
import {Image as RNImage, StyleSheet, useWindowDimensions} from 'react-native'
import type {ColorValue, ImageSourcePropType} from 'react-native'
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
	ZStack,
} from '@expo/ui/swift-ui'
import {
	accessibilityAddTraits,
	accessibilityRemoveTraits,
	accessibilityIdentifier,
	accessibilityLabel,
	aspectRatio,
	background,
	buttonStyle,
	contentShape,
	disabled as disabledModifier,
	font,
	foregroundStyle,
	frame,
	lineLimit,
	monospacedDigit,
	padding,
	resizable,
	shapes,
	truncationMode,
} from '@expo/ui/swift-ui/modifiers'
import type {ModifierConfig} from '@expo/ui/swift-ui/modifiers'
import * as c from '@frogpond/colors'
import type {Gradient} from '@frogpond/colors'

import {isAccessibilityTextSize} from '../lib/is-accessibility-text-size'
import {GradientRoundedRectangle} from './gradient-tile'
import {detailLinesOf, rowLabel, type RowDetail} from './lib/row-text'
import {SYSTEM_TYPEFACE, type Typeface} from './lib/typeface'

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
 * Where a row's tap goes, which its trailing accessory names: `push` draws
 * `chevron.right`, `action` draws nothing and tints the label instead, and
 * `external` draws `arrow.up.right`.
 */
export type RowDestination =
	/** Another screen in this navigation stack. */
	| 'push'
	/** The row is the thing, and tapping does it: a call, a message, a mutation. */
	| 'action'
	/** A document somewhere else, which tapping goes and shows. */
	| 'external'

/**
 * The trailing glyph naming a row's destination -- see [[RowDestination]]. An
 * action draws nothing: it completes what the row names and returns you
 * here, so there is nowhere to point. Exported for a row built by hand, so
 * every row in the app draws the same glyph at the same size.
 */
export function RowAccessory({destination}: {destination: RowDestination}): React.ReactNode {
	if (destination === 'action') {
		return null
	}

	return (
		<Image
			color={c.tertiaryLabel}
			size={14}
			systemName={destination === 'external' ? 'arrow.up.right' : 'chevron.right'}
		/>
	)
}

/**
 * VoiceOver reads a row's label and never its accessory, so a row that leaves
 * the app says so by reading as a link, as SwiftUI's own `Link` does. Adding
 * `isLink` alone is not enough: a button keeps `isButton`, and iOS still
 * reports it as a button until that trait is removed.
 */
export function destinationTraits(destination: RowDestination): ModifierConfig[] {
	return destination === 'external'
		? [accessibilityAddTraits(['isLink']), accessibilityRemoveTraits(['isButton'])]
		: []
}

/**
 * A row that pushes another screen via React Navigation. `@expo/ui` has no
 * `NavigationLink` (it mounts its destination as a SwiftUI view inside a
 * SwiftUI `NavigationStack`, and this app pushes via React Navigation, so
 * there is no SwiftUI view for it to push to) so the accessory is drawn by
 * hand -- see [[RowAccessory]].
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
				<RowAccessory destination="push" />
			</HStack>
		</Button>
	)
}

/**
 * A row that does something in place (show an alert, send a message, mutate)
 * rather than going anywhere -- an `action` in [[RowDestination]]'s terms.
 * Tinted text and no accessory, since there is nowhere to point. A row that
 * opens a URL is `external`: use a `DisclosureRow` for it.
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
 * A leading symbol, drawn by SwiftUI itself: one iOS ships, named by
 * `systemName`, or a custom one in the asset catalog, named by `assetName`.
 *
 * `label` is for a symbol that means something, like an unread dot: VoiceOver
 * reads the row as one element, so the label leads the row's own. `size`
 * overrides the usual symbol size, for a mark smaller than an icon. `width`
 * sets a column for the symbol to center in, so rows whose symbols differ in
 * width still start their titles at one edge.
 */
type SymbolImage = ({systemName: SFSymbol} | {assetName: string}) & {
	tint?: ColorValue
	size?: number
	label?: string
	width?: number
}

/**
 * A leading thumbnail: fetched over the network by `uri`, or bundled with the
 * app by `source`. `@expo/ui`'s own `Image` reads only SF Symbols,
 * asset-catalog names and local files, so this is a React Native image hosted
 * inside the SwiftUI row -- which needs its size stated up front, since
 * `RNHostView` gives a hosted view no bounds of its own.
 */
type ThumbnailImage = ({uri: string} | {source: ImageSourcePropType}) & {
	width: number
	height: number
}

/**
 * A white symbol on a small gradient square, as Settings draws its rows'
 * icons -- the row-sized cousin of a `GradientTile`, sharing its gradients.
 */
type GradientSymbolImage = ({systemName: SFSymbol} | {assetName: string}) & {gradient: Gradient}

export type DisclosureRowImage = SymbolImage | ThumbnailImage | GradientSymbolImage

/// Mirrored by `TestIdentifiers.Rows.thumbnail`.
const THUMBNAIL_ID = 'disclosure-row-thumbnail'

const SYMBOL_SIZE = 20

/// Settings' own icon size, and the corner that goes with it.
const ICON_SIZE = 30
const ICON_RADIUS = 7
const ICON_SYMBOL_SIZE = 17

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
	/** A count before the chevron, as Settings shows one. None at zero. */
	badge?: number
	/** A short word in a capsule before the chevron, such as an HTTP method. */
	tag?: {text: string; color: ColorValue}
	/** Where tapping the row goes. Defaults to a push. */
	destination?: RowDestination
	/** A live status under the details, in its own colour, as a place's open
	 * or closed state reads. */
	status?: {text: string; color: ColorValue}
	/** The type the title and details are set in, for a screen on a background of its own. */
	typeface?: Typeface
}

/** A short word in a tinted capsule, such as an HTTP method. */
export function Tag({text, color}: {text: string; color: ColorValue}): React.ReactNode {
	return (
		<Text
			modifiers={[
				font({textStyle: 'caption', weight: 'semibold', design: 'monospaced'}),
				foregroundStyle(color),
				padding({horizontal: 6, vertical: 2}),
				background(c.tertiarySystemFill, shapes.capsule()),
			]}
		>
			{text}
		</Text>
	)
}

/** A row's leading image: a tinted symbol, a gradient icon, or a thumbnail. */
export function LeadingImage({image}: {image: DisclosureRowImage}): React.ReactNode {
	if ('gradient' in image) {
		return (
			<ZStack modifiers={[frame({width: ICON_SIZE, height: ICON_SIZE})]}>
				{/* endRadius at the icon's height carries the gradient from its
				    start color at the top edge to its end color at the bottom. */}
				<GradientRoundedRectangle
					cornerRadius={ICON_RADIUS}
					endRadius={ICON_SIZE}
					gradient={image.gradient}
					showShadow={false}
				/>
				<Image
					{...('assetName' in image
						? {assetName: image.assetName}
						: {systemName: image.systemName})}
					color="white"
					// Fitted into a square rather than sized by font: a wide symbol
					// (three people) would otherwise stretch the icon past its siblings.
					modifiers={[
						resizable(),
						aspectRatio({contentMode: 'fit'}),
						frame({width: ICON_SYMBOL_SIZE, height: ICON_SYMBOL_SIZE}),
					]}
				/>
			</ZStack>
		)
	}

	if (!('uri' in image) && !('source' in image)) {
		return (
			<Image
				{...('assetName' in image ? {assetName: image.assetName} : {systemName: image.systemName})}
				color={image.tint ?? c.secondaryLabel}
				modifiers={image.width === undefined ? undefined : [frame({width: image.width})]}
				size={image.size ?? SYMBOL_SIZE}
			/>
		)
	}

	return (
		<HStack modifiers={[frame({width: image.width, height: image.height})]}>
			<RNHostView matchContents={false}>
				<RNImage
					accessibilityIgnoresInvertColors={true}
					source={'uri' in image ? {uri: image.uri} : image.source}
					style={[styles.thumbnail, {width: image.width, height: image.height}]}
					testID={THUMBNAIL_ID}
				/>
			</RNHostView>
		</HStack>
	)
}

/**
 * The list row this app repeats most: an optional leading image, a title, any
 * number of quieter detail lines, and a trailing accessory naming where the
 * tap goes. Shared rather than repeated per screen because the `contentShape`
 * placement below is easy to get wrong and impossible to catch in Jest -- see
 * [[NavigationRow]] for why the accessory is drawn by hand.
 */
export function DisclosureRow(props: DisclosureRowProps): React.ReactNode {
	let {
		title,
		detail,
		titleLines = 1,
		detailLines,
		image,
		identifier,
		onPress,
		badge,
		tag,
		destination = 'push',
		status,
		typeface = SYSTEM_TYPEFACE,
	} = props

	let {fontScale} = useWindowDimensions()
	let hasBadge = badge !== undefined && badge > 0
	// At an accessibility size a trailing count takes a third of the row and
	// the title breaks mid-word in what is left, so the count drops under the
	// title instead, as Settings does.
	let stacksBadge = hasBadge && isAccessibilityTextSize(fontScale)
	let badgeText = (
		<Text modifiers={[foregroundStyle(c.secondaryLabel), monospacedDigit()]}>{String(badge)}</Text>
	)
	// A tag drops under the title at an accessibility size for the same reason.
	let stacksTag = tag !== undefined && isAccessibilityTextSize(fontScale)
	let tagText = tag ? <Tag color={tag.color} text={tag.text} /> : null
	let spokenDetail = status ? [...detailLinesOf(detail), status.text] : detail
	let spokenLabel =
		image && 'label' in image && image.label
			? `${image.label}, ${rowLabel(title, spokenDetail)}`
			: rowLabel(title, spokenDetail)
	let spokenTrailing = [hasBadge ? String(badge) : null, tag?.text].filter(Boolean)

	let details = detailLinesOf(detail)
	let detailModifiers = [
		font({textStyle: 'subheadline', design: typeface.design}),
		foregroundStyle(typeface.secondaryLabel),
		...(detailLines ? [lineLimit(detailLines), truncationMode('tail')] : []),
	]

	// External already carries `arrow.up.right`; tinting the title too would
	// turn a long link list into a wall of blue.
	let titleTint = destination === 'action' ? typeface.tint : typeface.label

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel([spokenLabel, ...spokenTrailing].join(', ')),
				...destinationTraits(destination),
				...(identifier ? [accessibilityIdentifier(identifier)] : []),
			]}
			onPress={onPress}
		>
			{/* contentShape on the label, not the Button -- see NavigationRow. */}
			<HStack modifiers={[contentShape(shapes.rectangle())]} spacing={12}>
				{image ? <LeadingImage image={image} /> : null}
				<VStack alignment="leading" spacing={2}>
					<Text
						modifiers={[
							font({textStyle: 'body', design: typeface.design}),
							foregroundStyle(titleTint),
							lineLimit(titleLines),
							truncationMode('tail'),
						]}
					>
						{title}
					</Text>
					{details.map((line) => (
						<Text key={line} modifiers={detailModifiers}>
							{line}
						</Text>
					))}
					{status ? (
						<Text modifiers={[font({textStyle: 'subheadline'}), foregroundStyle(status.color)]}>
							{status.text}
						</Text>
					) : null}
					{stacksBadge ? badgeText : null}
					{stacksTag ? tagText : null}
				</VStack>
				<Spacer />
				{/* Drawn here rather than with SwiftUI's .badge, which puts the
				    count at the row's trailing edge -- past this row's own
				    chevron, where Settings never has it. */}
				{hasBadge && !stacksBadge ? badgeText : null}
				{stacksTag ? null : tagText}
				<RowAccessory destination={destination} />
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
})

type DetailRowProps = {
	/** The quieter half: what this value is. */
	label: string
	/** The value itself. */
	value: string
	/** How many lines the value may wrap to. Unbounded by default. */
	valueLines?: number
	/** Makes the row tappable, and draws an accessory naming where the tap goes. */
	onPress?: () => void
	/** Where tapping the row goes. Defaults to a push. Ignored without `onPress`. */
	destination?: RowDestination
}

/**
 * A label and its value, side by side -- the shape most of the detail screens
 * are made of.
 *
 * `LabeledContent` is SwiftUI's own, so the two halves align with every other
 * row in the list and follow the platform's own emphasis rather than ours.
 */
export function DetailRow(props: DetailRowProps): React.ReactNode {
	let {label, value, valueLines, onPress, destination = 'push'} = props

	// A tappable action or external value is the thing you reach -- a number to
	// call, a page to open -- so it is drawn as a link. A push leads to more
	// detail about the row, so its value stays secondary, as in Settings.
	let valueTint = onPress && destination !== 'push' ? c.systemBlue : c.secondaryLabel

	let content = (
		<LabeledContent label={label}>
			<HStack spacing={6}>
				<Text
					modifiers={[foregroundStyle(valueTint), ...(valueLines ? [lineLimit(valueLines)] : [])]}
				>
					{value}
				</Text>
				{onPress ? <RowAccessory destination={destination} /> : null}
			</HStack>
		</LabeledContent>
	)

	if (!onPress) {
		return content
	}

	return (
		<Button
			modifiers={[
				buttonStyle('plain'),
				accessibilityLabel(`${label}, ${value}`),
				...destinationTraits(destination),
			]}
			onPress={onPress}
		>
			{/* contentShape on the label, not the Button -- see NavigationRow. */}
			<HStack modifiers={[contentShape(shapes.rectangle())]}>{content}</HStack>
		</Button>
	)
}
