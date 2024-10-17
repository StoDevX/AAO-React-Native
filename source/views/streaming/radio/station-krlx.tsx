import * as React from 'react'
import * as c from '@frogpond/colors'
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

export function KrlxStationView(): React.JSX.Element {
	return (
		<ThemeProvider theme={colors}>
			<RadioControllerView
				image={logos.krlx}
				playerUrl="https://live.krlx.org"
				scheduleViewName="KRLXSchedule"
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
