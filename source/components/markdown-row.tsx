import * as React from 'react'
import {View} from 'react-native'
import {Markdown} from '@frogpond/markdown'

import {HostedRow, type RowProps} from './hosted-row'

/**
 * Markdown as a row of a SwiftUI list. A paragraph's own width is however long
 * its longest line would be unwrapped, so the row's width is given to it.
 */
export function MarkdownRow({source, rowModifiers}: RowProps & {source: string}): React.ReactNode {
	return (
		<HostedRow rowModifiers={rowModifiers}>
			{(rowWidth) => (
				<View style={{width: rowWidth}}>
					<Markdown source={source} />
				</View>
			)}
		</HostedRow>
	)
}
