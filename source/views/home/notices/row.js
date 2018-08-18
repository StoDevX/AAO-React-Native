// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Text, View} from 'glamorous-native'
import * as c from '../../components/colors'
import {Touchable} from '../../components/touchable'
import Icon from 'react-native-vector-icons/Ionicons'
import {Row, Column} from '../../components/layout'
import {CELL_MARGIN, cellVerticalPadding} from '../button'
import type {HomescreenNotice} from './types'
import type {NavType} from '../../types'

export function Notice(props: {notice: HomescreenNotice, navigation: NavType}) {
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

const SPACE_BETWEEN = 5
const styles = StyleSheet.create({
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
})

const iconStyles = StyleSheet.create({
	icon: {
		fontSize: 32,
		width: 32,
		textAlign: 'center',
	},
})
