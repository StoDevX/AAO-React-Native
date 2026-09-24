import * as React from 'react'
import tinycolor from 'tinycolor2'
import * as logos from '../../../images/streaming'
import {RadioControllerView} from '../../../source/features/streaming/radio'
import {tintedTheme} from '../../../source/features/streaming/radio/theme'

/**
 * Each tint passes the same checks: white button text on it is at least 4.5:1,
 * and it is at least 3:1 against both the light background and Dark Mode's
 * black, enough for the 28pt title.
 */
const COW_TINT = '#685393'
const WORDMARK_TINT = '#5a52b0'
const DUMPSTER_TINT = '#2a7d68'

export default function KstoPage(): React.ReactNode {
	return (
		<RadioControllerView
			logos={[
				{name: 'cow badge', image: logos.ksto, theme: tintedTheme(COW_TINT)},
				{name: 'wordmark', image: logos.kstoWordmark, theme: tintedTheme(WORDMARK_TINT)},
				{
					name: 'dumpster fire',
					image: logos.kstoDumpster,
					theme: tintedTheme(
						DUMPSTER_TINT,
						tinycolor(DUMPSTER_TINT).complement().setAlpha(0.2).toRgbString(),
					),
				},
			]}
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
	)
}
