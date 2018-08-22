// @flow

import * as React from 'react'
import {TabBarIcon} from '../components/tabbar-icon'
import openUrl from '../components/open-url'
import type {TopLevelViewPropsType} from '../types'
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
			<NoticeView
				buttonText="Open TES"
				header="Time Entry System"
				onPress={this.launchSite}
				text="The St. Olaf Time Entry System (TES) is the place to report your work hours, for both students and hourly staff."
			/>
		)
	}
}
