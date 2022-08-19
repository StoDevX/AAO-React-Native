/**
 * TODO(volz):
 * - Fix the typings of this view
 * - Undo disabling of eslint
 * See https://github.com/StoDevX/AAO-React-Native/issues/6007
 */

/* Disabling eslint as the view is not usable in the build */
/* eslint-disable */

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

export const DebugListView = (props: Props): JSX.Element => {
	let navigationOptions = ({navigation}: NavigationState) => {
		let titleParam = navigation.getParam('keyPath', ['Debug'])
		let title = titleParam[titleParam.length - 1]

		return {
			title: toLaxTitleCase(title),
		}
	}

	let onPressRow = (row: any) => {
		let apiTest = props.apiTest
		let keyPath = props.navigation.getParam('keyPath', [])
		keyPath = [...keyPath, row.key]
		props.navigation.push('DebugView', {keyPath, apiTest})
	}

	let keyExtractor = (item: any) => item.key

	let renderItem = ({item}: {item: any}) => (
		<DebugRow
			data={item}
			navigation={props.navigation}
			onPress={
				() => undefined
				// TODO: fix navigation in DebugListView
				// this.onPressRow(item)
			}
		/>
	)

	let parsedData = props.apiTest ? JSON.parse(props.state) : props.state

	let keyed = toPairs(parsedData).map(([key, value]) => {
		return {key, value}
	})

	return (
		<FlatList
			ItemSeparatorComponent={ListSeparator}
			ListEmptyComponent={<NoticeView text="Nothing found." />}
			data={keyed}
			keyExtractor={keyExtractor}
			renderItem={renderItem}
		/>
	)
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
