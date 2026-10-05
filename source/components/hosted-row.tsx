import * as React from 'react'
import {RNHostView, VStack} from '@expo/ui/swift-ui'
import {frame, onGeometryChange, type ModifierConfig} from '@expo/ui/swift-ui/modifiers'

import {FILL_WIDTH} from './tile-layout'
import {SHEET_ROW} from './place-card/card-style'

export type RowProps = {
	/**
	 * How the list lays the row out: its background, hairline and insets.
	 * Defaults to the sheet's own, which insets the content from the sheet's
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
export function HostedRow({
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
