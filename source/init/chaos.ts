import {Linking} from 'react-native'
import {
	chaosFaultRate,
	chaosLaunch,
	chaosMode,
	chaosSeed,
	isChaos,
} from '@frogpond/launch-arguments'

import {FINDINGS_FILE} from '../chaos/findings'
import {installChaos} from '../chaos/install'
import {documentLineFile} from '../chaos/line-file'
import {TAPE_FILE} from '../chaos/tape'

/** Hermes's rejection tracker, which React Native only enables in development. */
type HermesGlobal = {
	HermesInternal?: {
		enablePromiseRejectionTracker?: (options: unknown) => void
	}
}

// Imported first in app/_layout.tsx, so fetch is wrapped before anything fetches.
if (isChaos) {
	let hermes = (globalThis as HermesGlobal).HermesInternal
	installChaos(
		{isChaos, seed: chaosSeed, launch: chaosLaunch, mode: chaosMode, faultRate: chaosFaultRate},
		{
			global: globalThis,
			probe: {
				errorUtils: ErrorUtils,
				console,
				enableRejectionTracker: hermes?.enablePromiseRejectionTracker,
			},
			linking: Linking,
			tape: documentLineFile(TAPE_FILE),
			findings: documentLineFile(FINDINGS_FILE),
		},
	)
}
