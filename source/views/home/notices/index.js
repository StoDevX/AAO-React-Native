// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Text, View, ScrollView} from 'glamorous-native'
import {connect} from 'react-redux'
import * as c from '../../components/colors'
import {Touchable} from '../../components/touchable'
import Icon from 'react-native-vector-icons/Ionicons'
import {CELL_MARGIN} from '../button'
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
	const background = notice.backgroundColor ? notice.backgroundColor : c.white
	return (
		<Touchable
			onPress={() => navigation.push('NoticeDetailView', {notice})}
			style={[styles.notice, {backgroundColor: background}]}
		>
			<View style={styles.noticeIconView}>
				{notice.icon ? (
					<View style={iconStyles.wrapper}>
						<Icon
							name={`ios-${notice.icon}`}
							style={[iconStyles.icon, {color: notice.foregroundColor}]}
						/>
					</View>
				) : null}
			</View>
			<View style={styles.noticeContentView}>
				{notice.title ? (
					<Text
						numberOfLines={1}
						style={[styles.noticeTitle, {color: notice.foregroundColor}]}
					>
						{notice.title}
					</Text>
				) : null}
				{/* 2 or 1 line of description? */}
				<Text
					numberOfLines={2}
					style={[styles.noticeDescription, {color: notice.foregroundColor}]}
				>
					{notice.snippet || notice.message}
				</Text>
			</View>
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
		<Touchable
			onPress={() => navigation.push('NoticesListView')}
			style={styles.moreNotices}
		>
			<Text>{notices.length - 2} more notifications…</Text>
		</Touchable>
	)
}

function mapStateToProps(state: ReduxState): ReduxStateProps {
	const {notices} = state

	return {
		notices: notices.notices, // ? notices.applicable : [],
	}
}

export const ConnectedNotices = connect(mapStateToProps)(PlainNotices)

const styles = StyleSheet.create({
	notice: {
		marginHorizontal: CELL_MARGIN / 2,
		marginTop: 5,
		paddingTop: CELL_MARGIN,
		backgroundColor: c.white,
		borderRadius: 10,

		flexDirection: 'row',
	},
	noticeIconView: {
		alignItems: 'center',
		justifyContent: 'center',
	},
	noticeContentView: {},
	noticeTitle: {
		flex: 1,
		marginVertical: 5,
		marginHorizontal: 10,
		fontWeight: 'bold',
	},
	noticeDescription: {
		flex: 1,
		marginBottom: 10,
		marginHorizontal: 10,
	},
	moreNotices: {
		marginHorizontal: 10,
		marginVertical: 5,
	},
})

const iconStyles = StyleSheet.create({
	wrapper: {
		marginLeft: 10,
	},
	icon: {
		fontSize: 40,
	},
})
