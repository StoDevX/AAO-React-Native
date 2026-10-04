import * as React from 'react'
import {Image, StyleSheet} from 'react-native'
import {RNHostView, VStack} from '@expo/ui/swift-ui'
import {frame, onGeometryChange, type ModifierConfig} from '@expo/ui/swift-ui/modifiers'

import {FILL_WIDTH} from './tile-layout'
import {PICTURE_CORNER_RADIUS, SHEET_ROW} from './place-card/card-style'

type Props = {
	source: React.ComponentProps<typeof Image>['source']
	testID?: string
	/**
	 * How the list lays the row out: its background, hairline and insets.
	 * Defaults to the sheet's own, which insets the picture from the sheet's
	 * sides; a form whose rows are already inset passes its own.
	 */
	rowModifiers?: ModifierConfig[]
}

/**
 * A picture on its own row of a sheet, inset from the sheet's sides with
 * rounded corners, as the Hours sheet lays out a building's photo.
 *
 * The picture is given the row's width outright: 100% inside `RNHostView`
 * resolves against the whole sheet. The row fills its width whatever its
 * content's, so measuring it can't feed back on itself.
 */
export function InsetImageRow({source, testID, rowModifiers = SHEET_ROW}: Props): React.ReactNode {
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
			<RNHostView matchContents={true}>
				<Image
					accessibilityIgnoresInvertColors={true}
					resizeMode="cover"
					source={source}
					style={[styles.image, {width: rowWidth}]}
					testID={testID}
				/>
			</RNHostView>
		</VStack>
	)
}

const styles = StyleSheet.create({
	image: {
		height: 100,
		borderRadius: PICTURE_CORNER_RADIUS,
	},
})
