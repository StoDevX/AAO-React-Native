import * as React from 'react'
import {Image as RNImage, StyleSheet} from 'react-native'
import type {ColorValue} from 'react-native'
import type {SFSymbol} from 'sf-symbols-typescript'
import {Button, HStack, Image, RNHostView, Spacer, Text, VStack} from '@expo/ui/swift-ui'
import {
	accessibilityLabel,
	buttonStyle,
	contentShape,
	disabled as disabledModifier,
	font,
	foregroundStyle,
	lineLimit,
	frame,
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
	detail?: string | (string | undefined | null)[]
	/** How many lines the title may wrap to before it truncates. */
	titleLines?: number
	/** How many lines each detail line may wrap to. Unbounded by default. */
	detailLines?: number
	/** A symbol or thumbnail at the leading edge. */
	image?: DisclosureRowImage
	onPress: () => void
}

/** The detail lines actually worth drawing, in order. */
function detailLinesOf(detail: DisclosureRowProps['detail']): string[] {
	if (!detail) {
		return []
	}
	let lines = Array.isArray(detail) ? detail : [detail]
	return lines.filter((line): line is string => Boolean(line && line.trim()))
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
	let {title, detail, titleLines = 1, detailLines, image, onPress} = props

	let details = detailLinesOf(detail)
	let detailModifiers = [
		font({textStyle: 'subheadline'}),
		foregroundStyle(c.secondaryLabel),
		...(detailLines ? [lineLimit(detailLines), truncationMode('tail')] : []),
	]

	return (
		<Button
			modifiers={[buttonStyle('plain'), accessibilityLabel([title, ...details].join(', '))]}
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
	},
})
