import * as React from 'react'
import type {OtherModeType} from '../types'
import {Detail, ListRow, Title} from '../../../modules/lists'
import {Column, Row} from '../../../modules/layout'

interface Props {
	onPress: (mode: OtherModeType) => void
	mode: OtherModeType
}

export function OtherModesRow(props: Props): React.JSX.Element {
	let {mode, onPress} = props

	return (
		<ListRow
			arrowPosition="top"
			onPress={() => {
				onPress(mode)
			}}
		>
			<Row alignItems="center">
				<Column flex={1}>
					<Title lines={1}>{mode.name}</Title>
					<Detail>{mode.synopsis}</Detail>
				</Column>
			</Row>
		</ListRow>
	)
}
