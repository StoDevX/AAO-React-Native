// @flow

import * as React from 'react'
import * as c from '../../components/colors'
import {TabBarIcon} from '../../components/tabbar-icon'
import {type TopLevelViewPropsType} from '../../types'
import * as logos from '../../../../images/streaming'
import {RadioControllerView} from './index'

export class KrlxStationView extends React.Component<TopLevelViewPropsType> {
	static navigationOptions = {
		tabBarLabel: 'KRLX',
		tabBarIcon: TabBarIcon('microphone'),
	}

	render() {
		return (
				<RadioControllerView
					image={logos.krlx}
					navigation={this.props.navigation}
					playerUrl="http://live.krlx.org"
					scheduleViewName="KRLXScheduleView"
					source={{
						useEmbeddedPlayer: false,
						embeddedPlayerUrl: 'http://live.krlx.org',
						streamSourceUrl: 'http://radio.krlx.org/mp3/high_quality',
					}}
					stationName="88.1 KRLX-FM"
					stationNumber="+15072224127"
					title="Carleton College Radio"
				/>
		)
	}
}
