import * as React from 'react'
import {sto} from '../../../source/lib/colors'
import * as logos from '../../../images/streaming'
import {RadioControllerView} from '../../../source/features/streaming/radio'
import tinycolor from 'tinycolor2'
import {PlayerTheme, theming} from '../../../source/features/streaming/radio/theme'

/**
 * A purple from the cow badge. White text on it is 6.5:1, and it is 3.3:1
 * against Dark Mode's black, enough for the 28pt title, so one tint serves both.
 */
const TINT_COLOR = '#685393'
const colors: PlayerTheme = {
	tintColor: TINT_COLOR,
	buttonTextColor: tinycolor.mostReadable(TINT_COLOR, [sto.white, sto.black]).toRgbString(),
	textColor: TINT_COLOR,
	imageBorderColor: 'transparent',
	imageBackgroundColor: 'transparent',
}

export default function KstoPage(): React.ReactNode {
	return (
		<theming.ThemeProvider theme={colors}>
			<RadioControllerView
				image={logos.ksto}
				playerUrl="https://www.stolaf.edu/multimedia/play/embed/ksto.html"
				scheduleHref="/KSTOSchedule"
				source={{
					useEmbeddedPlayer: true,
					embeddedPlayerUrl: 'https://www.stolaf.edu/multimedia/play/embed/ksto.html',
					streamSourceUrl: '',
				}}
				stationName="KSTO 93.1 FM"
				stationNumber="+15077863602"
				title="St. Olaf College Radio"
			/>
		</theming.ThemeProvider>
	)
}
