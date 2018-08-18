// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Text, View, ScrollView} from 'glamorous-native'
import {connect} from 'react-redux'
import * as c from '../../components/colors'
import {Touchable} from '../../components/touchable'
import Icon from 'react-native-vector-icons/Ionicons'
import {Row, Column} from '../../components/layout'
import {
	CELL_MARGIN,
	cellVerticalPadding,
	cellHorizontalPadding,
} from '../button'
import type {HomescreenNotice} from './types'
import type {NavType, TopLevelViewPropsType} from '../../types'
import type {ReduxState} from '../../../flux'

type ReduxStateProps = {
	notices: Array<HomescreenNotice>,
}

type NoticesProps = TopLevelViewPropsType & ReduxStateProps;

export function PlainNotices({notices, navigation}: NoticesProps) {
	if (!notices.length) {
		return null
	}

	let twoNotices = notices.slice(0, 2)

	return (
		<View style={styles.container}>
			{twoNotices.map((n, i) => (
				<Notice key={i} navigation={navigation} notice={n} />
			))}
			{notices.length > 2 ? (
				<MoreNotices navigation={navigation} notices={notices} />
			) : null}
		</View>
	)
}

function Notice(props: {notice: HomescreenNotice, navigation: NavType}) {
	let {notice, navigation} = props
	let background = notice.backgroundColor
		? notice.backgroundColor
		: 'rgba(0,0,0,0.6)'
	let foreground = notice.foregroundColor ? notice.foregroundColor : c.white

	return (
		<View style={styles.cell}>
			<Touchable
				onPress={() => navigation.push('NoticeDetailView', {notice})}
				style={[styles.touchable, {backgroundColor: background}]}
			>
				<Row>
					<Column style={styles.iconColumn}>
						<Icon
							name={notice.icon ? `ios-${notice.icon}` : 'ios-alert'}
							style={[iconStyles.icon, {color: foreground}]}
						/>
					</Column>

					<Column style={styles.textColumn}>
						{notice.title ? (
							<Text
								numberOfLines={1}
								style={[styles.title, {color: foreground}]}
							>
								{notice.title}
							</Text>
						) : null}

						<Text
							numberOfLines={1}
							style={[styles.description, {color: foreground}]}
						>
							{notice.snippet || notice.message}
						</Text>
					</Column>
				</Row>
			</Touchable>
		</View>
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
		notices: notices ? notices.notices : [], // ? notices.applicable : [],
	}
}

export const ConnectedNotices = connect(mapStateToProps)(PlainNotices)

const SPACE_BETWEEN = 5
const styles = StyleSheet.create({
	container: {
		marginTop: SPACE_BETWEEN / 2,
		marginBottom: SPACE_BETWEEN / 2,
		marginHorizontal: CELL_MARGIN,
	},
	cell: {
		marginVertical: SPACE_BETWEEN / 2,
		borderRadius: 10,
		overflow: 'hidden',
	},
	touchable: {
		paddingVertical: cellVerticalPadding,
		paddingHorizontal: 10,
	},
	iconColumn: {
		justifyContent: 'center',
		marginRight: 10,
	},
	textColumn: {
		flex: 1,
	},
	title: {
		marginBottom: 3,
		fontWeight: 'bold',
	},
	description: {},
	moreNotices: {
		marginHorizontal: 10,
		marginVertical: 5,
	},
})

const iconStyles = StyleSheet.create({
	icon: {
		fontSize: 32,
		width: 32,
		textAlign: 'center',
	},
})
