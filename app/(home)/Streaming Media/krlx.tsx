import * as React from 'react'
import * as c from '@frogpond/colors'
import * as logos from '../../../images/streaming'
import {RadioControllerView} from '../../../source/features/streaming/radio'
import tinycolor from 'tinycolor2'
import {PlayerTheme, theming} from '../../../source/features/streaming/radio/theme'

/**
 * The purple of the logo's "krlx". White text on it is 5.5:1, and it is 3.8:1
 * against Dark Mode's black, enough for the 28pt title, so one tint serves both.
 */
let tintColor = '#8a529e'
const colors: PlayerTheme = {
	tintColor,
	buttonTextColor: tinycolor.mostReadable(tintColor, [c.white, c.black]).toRgbString(),
	textColor: tintColor,
	imageBorderColor: 'transparent',
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
