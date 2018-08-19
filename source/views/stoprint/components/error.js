// @flow

import React from 'react'
import type {TopLevelViewPropsType} from '../../types'
import {View, StyleSheet, Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {NoticeView} from '../../components/notice'
import * as c from '../../components/colors'

type Props = TopLevelViewPropsType

export function StoprintErrorView(props: Props) {
	const iconName = Platform.select({
		ios: 'ios-bug',
		android: 'md-bug',
	})
	return (
		<View style={styles.container}>
			<Icon color={c.sto.black} name={iconName} size={100} />
			<NoticeView
				buttonText="Report"
				header="Look! A bug!"
				onPress={() => props.navigation.navigate('HelpView')}
				style={styles.notice}
				text="We're sorry, but an unexpected error occurred when trying to connect to Stoprint. Please report this so we can make sure it doesn't happen again."
			/>
		</View>
	)
}

const styles = StyleSheet.create({
	container: {
		flex: 1,
		alignItems: 'center',
		justifyContent: 'center',
		backgroundColor: c.sto.white,
	},
	notice: {
		flex: 0,
	},
})
