// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import {View} from 'glamorous-native'
import {connect} from 'react-redux'
import {CELL_MARGIN} from '../button'
import type {HomescreenNotice} from './types'
import type {TopLevelViewPropsType} from '../../types'
import type {ReduxState} from '../../../flux'
import {Notice} from './row'
import {MoreNotices} from './list'

type ReduxStateProps = {
	notices: Array<HomescreenNotice>,
}

type NoticesProps = TopLevelViewPropsType & ReduxStateProps

export function Notices({notices, navigation}: NoticesProps) {
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

function mapStateToProps(state: ReduxState): ReduxStateProps {
	const {notices} = state

	return {
		notices: notices ? notices.notices : [], // ? notices.applicable : [],
	}
}

export const ConnectedNotices = connect(mapStateToProps)(Notices)

const SPACE_BETWEEN = 5
const styles = StyleSheet.create({
	container: {
		marginTop: SPACE_BETWEEN / 2,
		marginBottom: SPACE_BETWEEN / 2,
		marginHorizontal: CELL_MARGIN,
	},
})
