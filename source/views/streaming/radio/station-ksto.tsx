import * as React from 'react'
import {sto} from '../../../lib/colors'
import * as logos from '../../../../images/streaming'
import {RadioControllerView} from './index'
import tinycolor from 'tinycolor2'
import {PlayerTheme, ThemeProvider} from './theme'

let tintColor = '#37a287'
const colors: PlayerTheme = {
	tintColor,
	buttonTextColor: tinycolor
		.mostReadable(tintColor, [sto.white, sto.black])
		.toRgbString(),
	textColor: tintColor,
	imageBorderColor: 'transparent',
	imageBackgroundColor: tinycolor(tintColor)
		.complement()
		.setAlpha(0.2)
		.toRgbString(),
}

export function KstoStationView(): JSX.Element {
	return (
		<ThemeProvider theme={colors}>
			<RadioControllerView
				image={logos.ksto}
				playerUrl="https://www.stolaf.edu/multimedia/play/embed/ksto.html"
				scheduleViewName="KSTOSchedule"
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
