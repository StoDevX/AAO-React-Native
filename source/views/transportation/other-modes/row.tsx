import * as React from 'react'
import type {OtherModeType} from '../types'
import {Detail, ListRow, Title} from '@frogpond/lists'
import {Column, Row} from '@frogpond/layout'

type Props = {
	onPress: (mode: OtherModeType) => void
	mode: OtherModeType
}

export class OtherModesRow extends React.PureComponent<Props> {
	render(): JSX.Element {
		let {mode} = this.props

		return (
			<ListRow
				arrowPosition="top"
				onPress={() => this.props.onPress(this.props.mode)}
			>
				<Row alignItems="center">
					<Column flex={1}>
						<Title lines={1}>{mode.name}</Title>
						<Detail lines={1}>{mode.synopsis}</Detail>
					</Column>
				</Row>
			</ListRow>
		)
	}
}
