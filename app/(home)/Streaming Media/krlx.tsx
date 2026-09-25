import * as React from 'react'
import * as logos from '../../../images/streaming'
import {RadioControllerView} from '../../../source/features/streaming/radio'
import {tintedTheme} from '../../../source/features/streaming/radio/theme'

export default function KrlxPage(): React.ReactNode {
	return (
		<RadioControllerView
			logos={[
				{
					name: 'krlx 88.1',
					image: logos.krlx,
					// The purple of the logo's "krlx". White text on it is 5.5:1, and
					// it is 3.8:1 against Dark Mode's black, so the buttons stand out
					// in both modes.
					theme: tintedTheme('#8a529e'),
					labelColor: '#f6f1e4',
				},
			]}
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
	)
}
