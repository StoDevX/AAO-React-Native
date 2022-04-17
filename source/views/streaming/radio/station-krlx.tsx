import * as React from 'react'
import * as c from '@frogpond/colors'
import {TabBarIcon} from '@frogpond/navigation-tabs'
import type {TopLevelViewPropsType} from '../../types'
import * as logos from '../../../../images/streaming'
import {RadioControllerView} from './index'
import tinycolor from 'tinycolor2'
import {PlayerTheme, ThemeProvider} from './theme'

let tintColor = '#33348e'
const colors: PlayerTheme = {
	tintColor,
	buttonTextColor: tinycolor
		.mostReadable(tintColor, [c.white, c.black])
		.toRgbString(),
	textColor: tintColor,
	imageBorderColor: tintColor,
	imageBackgroundColor: 'transparent',
}

export class KrlxStationView extends React.Component<TopLevelViewPropsType> {
	static navigationOptions = {
		tabBarLabel: 'KRLX',
		tabBarIcon: TabBarIcon('microphone'),
	}

	render(): JSX.Element {
		return (
			<ThemeProvider theme={colors}>
				<RadioControllerView
					image={logos.krlx}
					navigation={this.props.navigation}
					playerUrl="https://live.krlx.org"
					scheduleViewName="KRLXScheduleView"
					source={{
						useEmbeddedPlayer: false,
						embeddedPlayerUrl: 'https://live.krlx.org',
						streamSourceUrl: 'http://radio.krlx.org/mp3/high_quality',
					}}
					stationName="88.1 KRLX-FM"
					stationNumber="+15072224127"
					title="Carleton College Radio"
				/>
			</ThemeProvider>
		)
	}
}
