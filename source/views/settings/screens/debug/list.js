// @flow

import * as React from 'react'
import {FlatList} from 'react-native'
import {DebugRow} from './row'
import {connect} from 'react-redux'
import {NoticeView} from '../../../components/notice'
import {ListSeparator} from '../../../components/list'
import toPairs from 'lodash/toPairs'
import {toLaxTitleCase} from 'titlecase'
import get from 'lodash/get'
import type {NavigationState} from 'react-navigation'
import type {TopLevelViewPropsType} from '../../types'

type Props = TopLevelViewPropsType & {
	state: any,
}

export class DebugListView extends React.PureComponent<Props> {
	static navigationOptions = ({navigation}: NavigationState) => {
		let titleParam = navigation.getParam('keyPath', 'Debug')
		let title =
			titleParam === 'Debug' ? titleParam : titleParam[titleParam.length - 1]

		return {
			title: toLaxTitleCase(title),
		}
	}

	onPressRow = (row: any) => {
		let keyPath = this.props.navigation.getParam('keyPath', [])
		keyPath = [...keyPath, row.key]
		this.props.navigation.push('DebugView', {keyPath: keyPath})
	}

	keyExtractor = (item: any) => item.key

	renderItem = ({item}: {item: any}) => (
		<DebugRow
			data={item}
			navigation={this.props.navigation}
			onPress={() => this.onPressRow(item)}
		/>
	)

	render() {
		let keyed = toPairs(this.props.state).map(([key, value]) => {
			return {key, value}
		})

		return (
			<FlatList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={<NoticeView text="Nothing found in redux." />}
				data={keyed}
				keyExtractor={this.keyExtractor}
				renderItem={this.renderItem}
			/>
		)
	}
}

function mapStateToProps(state, ownProps) {
	if (!ownProps.navigation.getParam('keyPath', null)) {
		return {state}
	}

	return {
		state: get(state, ownProps.navigation.getParam('keyPath')),
	}
}

export const ConnectedDebugListView = connect(mapStateToProps)(DebugListView)
