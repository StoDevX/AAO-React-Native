import * as React from 'react'
import {DynamicColorIOS} from 'react-native'
import * as c from '@frogpond/colors'
import * as logos from '../../../images/streaming'
import {RadioControllerView} from '../../../source/features/streaming/radio'
import tinycolor from 'tinycolor2'
import {PlayerTheme, theming} from '../../../source/features/streaming/radio/theme'

/**
 * KRLX's navy is about 2:1 against Dark Mode's black background, so the dark
 * variant is lightened until the 28pt title clears 4:1.
 */
const LIGHT_TINT = '#33348e'
const DARK_TINT = '#6162c6'

let tintColor = DynamicColorIOS({light: LIGHT_TINT, dark: DARK_TINT})
const colors: PlayerTheme = {
	tintColor,
	buttonTextColor: DynamicColorIOS({
		light: tinycolor.mostReadable(LIGHT_TINT, [c.white, c.black]).toRgbString(),
		dark: tinycolor.mostReadable(DARK_TINT, [c.white, c.black]).toRgbString(),
	}),
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
