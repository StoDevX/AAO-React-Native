// @flow

import * as React from 'react'
import * as c from '../../components/colors'
import {TabBarIcon} from '../../components/tabbar-icon'
import {type TopLevelViewPropsType} from '../../types'
import * as logos from '../../../../images/streaming'
import {RadioControllerView} from './index'
import tinycolor from 'tinycolor2'
import {ThemeProvider} from '@callstack/react-theme-provider'
import {type PlayerTheme} from './types'

let tintColor = '#37a287'
const colors: PlayerTheme = {
	tintColor,
	buttonTextColor: tinycolor.mostReadable(tintColor, [
		c.sto.white,
		c.sto.black,
	]),
	textColor: tintColor,
	imageBorderColor: 'transparent',
	imageBackgroundColor: tinycolor(tintColor)
		.complement()
		.setAlpha(0.2)
		.toString(),
}

export class KstoStationView extends React.Component<TopLevelViewPropsType> {
	static navigationOptions = {
		tabBarLabel: 'KSTO',
		tabBarIcon: TabBarIcon('radio'),
	}

	render() {
		return (
			<ThemeProvider theme={colors}>
				<RadioControllerView
					image={logos.ksto}
					navigation={this.props.navigation}
					playerUrl="https://www.stolaf.edu/multimedia/play/embed/ksto.html"
					scheduleViewName="KSTOScheduleView"
					source={{
						useEmbeddedPlayer: true,
						embeddedPlayerUrl:
							'https://www.stolaf.edu/multimedia/play/embed/ksto.html',
						streamSourceUrl: '',
					}}
					stationName="KSTO 93.1 FM"
					stationNumber="+15077863602"
					title="St. Olaf College Radio"
				/>
			</ThemeProvider>
		)
	}
}
