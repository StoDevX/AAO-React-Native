// @flow
import * as React from 'react'
import {Alert} from 'react-native'
import {Column, Row} from '@frogpond/layout'
import {ListRow, Detail, Title} from '@frogpond/lists'

type Props = {
	onPress: string => any,
	branch: any,
}

export class BranchRow extends React.PureComponent<Props> {
	_onPress = () => {
		if (!this.props.branch.item.commit.url) {
			Alert.alert('There is nowhere to go for this branch')
			return
		}
		// this.props.onPress(this.props.branch.link)
	}

	render() {
		const {branch} = this.props

		return (
			<ListRow arrowPosition="top" onPress={this._onPress}>
				<Row alignItems="center">
					<Column flex={1}>
						<Title lines={1}>{branch.item.name}</Title>
						<Detail lines={1}>{branch.item.commit.sha}</Detail>
					</Column>
				</Row>
			</ListRow>
		)
	}
}
