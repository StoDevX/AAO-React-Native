// @flow

import * as React from 'react'
import {Text, View, ScrollView} from 'glamorous-native'
import {connect} from 'react-redux'
import * as c from '../../components/colors'
import {Touchable} from '../../components/touchable'
import type {HomescreenNotice} from './types'
import type {NavType, TopLevelViewPropsType} from '../../types'
import type {ReduxState} from '../../../flux'

type ReduxStateProps = {
	notices: Array<HomescreenNotice>,
}

type NoticesProps = {navigation: NavType} & ReduxStateProps & {}

export function PlainNotices({notices, navigation}: NoticesProps) {
	if (!notices.length) {
		return null
	}

	return (
		<View>
			{notices
				.slice(0, 2)
				.map((n, i) => <Notice key={i} navigation={navigation} notice={n} />)}
			{notices.length > 2 ? (
				<MoreNotices navigation={navigation} notices={notices} />
			) : null}
		</View>
	)
}

function Notice(props: {notice: HomescreenNotice, navigation: NavType}) {
	const {notice, navigation} = props

	return (
		<Touchable onPress={() => navigation.push('NoticeDetailView', {notice})}>
			{notice.title ? <Text numberOfLines={1}>{notice.title}</Text> : null}
			{/* 2 or 1 line of description? */}
			<Text numberOfLines={2}>{notice.snippet || notice.message}</Text>
			{/* <Text numberOfLines={2}>{JSON.stringify(notice)}</Text> */}
		</Touchable>
	)
}

export function NoticeDetailView({navigation}: TopLevelViewPropsType) {
	return (
		<ScrollView>
			<Text>{JSON.stringify(navigation.state.params.notice)}</Text>
		</ScrollView>
	)
}

function MoreNotices(props: {
	notices: Array<HomescreenNotice>,
	navigation: NavType,
}) {
	const {notices, navigation} = props

	return (
		<Touchable onPress={() => navigation.push('NoticesListView')}>
			<Text>{notices.length - 2} more notifications…</Text>
		</Touchable>
	)
}

function mapStateToProps(state: ReduxState): ReduxStateProps {
	const {notices} = state

	return {
		notices: notices ? notices.applicable : [],
	}
}

export const ConnectedNotices = connect(mapStateToProps)(PlainNotices)
