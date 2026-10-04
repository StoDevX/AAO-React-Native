import * as React from 'react'
import {Image, Pressable, StyleSheet} from 'react-native'
import {RNHostView, VStack} from '@expo/ui/swift-ui'
import {frame, onGeometryChange, type ModifierConfig} from '@expo/ui/swift-ui/modifiers'

import {fitImage} from './lib/fit-image'
import {FILL_WIDTH} from './tile-layout'
import {PICTURE_CORNER_RADIUS, SHEET_ROW} from './place-card/card-style'

type RowProps = {
	/**
	 * How the list lays the row out: its background, hairline and insets.
	 * Defaults to the sheet's own, which insets the picture from the sheet's
	 * sides; a form whose rows are already inset passes its own.
	 */
	rowModifiers?: ModifierConfig[]
}

/**
 * A row of a sheet holding React Native content, given the row's width
 * outright: 100% inside `RNHostView` resolves against the whole sheet. The row
 * fills its width whatever its content's, so measuring it can't feed back on
 * itself.
 */
function HostedRow({
	rowModifiers = SHEET_ROW,
	beside,
	children,
}: RowProps & {
	/** Drawn in the row after the hosted content, outside its host. */
	beside?: React.ReactNode
	children: (rowWidth: number) => React.ReactElement
}): React.ReactNode {
	let [rowWidth, setRowWidth] = React.useState(0)

	// On a wrapping stack because RNHostView takes no modifiers of its own. The
	// list's row modifiers go last: outside the frame, where the list reads them.
	return (
		<VStack
			modifiers={[
				frame({maxWidth: FILL_WIDTH}),
				onGeometryChange((box) => setRowWidth(box.width)),
				...rowModifiers,
			]}
		>
			<RNHostView matchContents={true}>{children(rowWidth)}</RNHostView>
			{beside}
		</VStack>
	)
}

type BannerProps = RowProps & {
	source: React.ComponentProps<typeof Image>['source']
	testID?: string
	/** Called when the picture cannot be loaded, for a screen to leave the row out. */
	onError?: () => void
}

/**
 * A picture on its own row of a sheet, inset from the sheet's sides with
 * rounded corners, as the Hours sheet lays out a building's photo: a banner of
 * fixed height, cropped to fill it.
 */
export function InsetImageRow({
	source,
	testID,
	rowModifiers,
	onError,
}: BannerProps): React.ReactNode {
	return (
		<HostedRow rowModifiers={rowModifiers}>
			{(rowWidth) => (
				<Image
					accessibilityIgnoresInvertColors={true}
					onError={onError}
					resizeMode="cover"
					source={source}
					style={[styles.banner, {width: rowWidth}]}
					testID={testID}
				/>
			)}
		</HostedRow>
	)
}

type FittedProps = RowProps & {
	uri: string
	/** What a screen reader says of the picture, which opens on a tap. */
	label: string
	/** The tallest the picture is drawn, in points. */
	maxHeight: number
	onPress: () => void
	testID?: string
	/** Drawn in the row beside the picture: the viewer its tap opens. */
	beside?: React.ReactNode
}

/**
 * A remote picture's pixel size, or null until the loader reports it -- and for
 * good if it cannot. The size is kept with its `uri`, so a size read for the
 * previous picture is never taken for the next one's.
 */
function useImageSize(uri: string): {width: number; height: number} | null {
	let [size, setSize] = React.useState<{uri: string; width: number; height: number} | null>(null)

	React.useEffect(() => {
		let cancelled = false
		Image.getSize(
			uri,
			(width, height) => {
				if (!cancelled) {
					setSize({uri, width, height})
				}
			},
			() => {
				// A picture that will not load leaves no row at all, rather than an
				// empty one.
			},
		)
		return () => {
			cancelled = true
		}
	}, [uri])

	return size?.uri === uri ? size : null
}

/**
 * A remote picture on its own row, whole rather than cropped: as wide as the
 * row, or as tall as `maxHeight` and narrower, centred, if it would be taller.
 * A submitted picture of any shape therefore cannot push the rest of the screen
 * out of reach.
 *
 * Absent until the picture's size is known, since its height follows from it.
 */
export function FittedImageRow({
	uri,
	label,
	maxHeight,
	onPress,
	testID,
	rowModifiers,
	beside,
}: FittedProps): React.ReactNode {
	let natural = useImageSize(uri)

	if (!natural) {
		return null
	}

	return (
		<HostedRow beside={beside} rowModifiers={rowModifiers}>
			{(rowWidth) => {
				let size = fitImage({
					rowWidth,
					imageWidth: natural.width,
					imageHeight: natural.height,
					maxHeight,
				})
				return (
					<Pressable
						accessibilityLabel={label}
						accessibilityRole="imagebutton"
						onPress={onPress}
						style={[styles.fitted, size]}
					>
						<Image
							accessibilityIgnoresInvertColors={true}
							resizeMode="contain"
							source={{uri}}
							style={size}
							testID={testID}
						/>
					</Pressable>
				)
			}}
		</HostedRow>
	)
}

const styles = StyleSheet.create({
	banner: {
		height: 100,
		borderRadius: PICTURE_CORNER_RADIUS,
	},
	fitted: {
		borderRadius: PICTURE_CORNER_RADIUS,
		overflow: 'hidden',
	},
})
