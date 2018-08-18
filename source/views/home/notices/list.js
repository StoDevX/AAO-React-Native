// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Text} from 'glamorous-native'
import * as c from '../../components/colors'
import {Touchable} from '../../components/touchable'
import type {HomescreenNotice} from './types'
import type {NavType} from '../../types'

export function MoreNotices(props: {
	notices: Array<HomescreenNotice>,
	navigation: NavType,
}) {
	const {notices, navigation} = props

	return (
		<Touchable
			onPress={() => navigation.push('NoticesListView')}
			style={styles.container}
		>
			<Text>{notices.length - 2} more notifications…</Text>
		</Touchable>
	)
}

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 10,
		marginVertical: 5,
	},
})
