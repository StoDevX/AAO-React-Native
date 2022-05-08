import * as React from 'react'
import {FlatList} from 'react-native'
import {DebugRow} from './row'
import {useSelector} from 'react-redux'
import {NoticeView} from '@frogpond/notice'
import {ListSeparator} from '@frogpond/lists'
import toPairs from 'lodash/toPairs'
import {toLaxTitleCase} from '@frogpond/titlecase'
import get from 'lodash/get'
import type {NavigationState} from 'react-navigation'
import type {ReduxState} from '../../../../redux'
import type {TopLevelViewPropsType} from '../../../types'

type Props = TopLevelViewPropsType & {
	apiTest?: boolean
	state: any
}

export class DebugListView extends React.PureComponent<Props> {
	static navigationOptions = ({navigation}: NavigationState) => {
		let titleParam = navigation.getParam('keyPath', ['Debug'])
		let title = titleParam[titleParam.length - 1]

		return {
			title: toLaxTitleCase(title),
		}
	}

	onPressRow = (row: any) => {
		let apiTest = this.props.apiTest
		let keyPath = this.props.navigation.getParam('keyPath', [])
		keyPath = [...keyPath, row.key]
		this.props.navigation.push('DebugView', {keyPath, apiTest})
	}

	keyExtractor = (item: any) => item.key

	renderItem = ({item}: {item: any}) => (
		<DebugRow
			data={item}
			navigation={this.props.navigation}
			onPress={
				() => undefined
				// TODO: fix navigation in DebugListView
				// this.onPressRow(item)
			}
		/>
	)

	render() {
		let parsedData = this.props.apiTest
			? JSON.parse(this.props.state)
			: this.props.state

		let keyed = toPairs(parsedData).map(([key, value]) => {
			return {key, value}
		})

		return (
			<FlatList
				ItemSeparatorComponent={ListSeparator}
				ListEmptyComponent={<NoticeView text="Nothing found." />}
				data={keyed}
				keyExtractor={this.keyExtractor}
				renderItem={this.renderItem}
			/>
		)
	}
}

export function ConnectedDebugListView(
	props: TopLevelViewPropsType,
): JSX.Element {
	let keyPath = props.navigation.getParam('keyPath', [])
	let state = useSelector((state: ReduxState) => {
		if (keyPath.length === 0) {
			return state
		}
		return get(state, keyPath, {})
	})

	return <DebugListView {...props} state={state} />
}
