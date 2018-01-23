// @flow

import * as React from 'react'
import {View, StyleSheet} from 'react-native'
import {TabBarIcon} from '../components/tabbar-icon'
import openUrl from '../components/open-url'
import type {TopLevelViewPropsType} from '../types'
import * as c from '../components/colors'
import {NoticeView} from '../components/notice'

type Props = TopLevelViewPropsType

export default class TESView extends React.PureComponent<Props> {
	static navigationOptions = {
		tabBarLabel: 'TES',
		tabBarIcon: TabBarIcon('cash'),
	}

	launchSite = () => {
		openUrl('https://www.stolaf.edu/apps/tes/')
	}

	render() {
		return (
			<View style={styles.container}>
				<NoticeView
					buttonText="Open TES"
					header="Time Entry System"
					onPress={this.launchSite}
					text="The St. Olaf Time Entry System (TES) is the place to report your work hours, for both students and hourly staff."
				/>
			</View>
		)
	}
}

const styles = StyleSheet.create({
	container: {
		alignItems: 'center',
		flexGrow: 1,
		flexDirection: 'column',
		justifyContent: 'center',
		backgroundColor: c.white,
		padding: 20,
	},
})
