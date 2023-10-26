import * as React from 'react'

import {Column, Row} from '@frogpond/layout'
import {Detail, ListRow, Title} from '@frogpond/lists'

import type {OtherModeType} from '../types'

type Props = {
	onPress: (mode: OtherModeType) => void
	mode: OtherModeType
}

export function OtherModesRow(props: Props): JSX.Element {
	let {mode, onPress} = props

	return (
		<ListRow arrowPosition="top" onPress={() => onPress(mode)}>
			<Row alignItems="center">
				<Column flex={1}>
					<Title lines={1}>{mode.name}</Title>
					<Detail>{mode.synopsis}</Detail>
				</Column>
			</Row>
		</ListRow>
	)
}
