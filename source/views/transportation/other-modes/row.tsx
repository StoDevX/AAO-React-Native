import type {OtherModeType} from '../types'
import {Detail, ListRow, Title} from '@frogpond/lists'
import {Column, Row} from '@frogpond/layout'

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
					<Detail lines={1}>{mode.synopsis}</Detail>
				</Column>
			</Row>
		</ListRow>
	)
}
