import {Linking, Share} from 'react-native'
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
import type {ProbeHost} from '../chaos/probe'
import {tapeFile} from '../chaos/tape'

/** React Native's `ExceptionsManager`, which has no public export. */
const exceptionsManager: ProbeHost['exceptionsManager'] =
	// oxlint-disable-next-line no-require-imports
	require('react-native/Libraries/Core/ExceptionsManager').default

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
				exceptionsManager,
				console,
				enableRejectionTracker: hermes?.enablePromiseRejectionTracker,
			},
			linking: Linking,
			share: Share,
			tape: documentLineFile(tapeFile(chaosLaunch)),
			findings: documentLineFile(FINDINGS_FILE),
		},
	)
}
