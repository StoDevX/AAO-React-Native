import * as React from 'react'
import * as c from '@frogpond/colors'
import * as logos from '../../../images/streaming'
import {RadioControllerView} from '../../../source/features/streaming/radio'
import tinycolor from 'tinycolor2'
import {
	PlayerTheme,
	theming,
} from '../../../source/features/streaming/radio/theme'

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

export default function KrlxPage(): React.ReactNode {
	return (
		<theming.ThemeProvider theme={colors}>
			<RadioControllerView
				image={logos.krlx}
				playerUrl="https://live.krlx.org"
				scheduleHref="/KRLXSchedule"
				source={{
					useEmbeddedPlayer: false,
					embeddedPlayerUrl: 'https://live.krlx.org',
					streamSourceUrl: 'http://radio.krlx.org/mp3/high_quality',
				}}
				stationName="88.1 KRLX-FM"
				stationNumber="+15072224127"
				title="Carleton College Radio"
			/>
		</theming.ThemeProvider>
	)
}
