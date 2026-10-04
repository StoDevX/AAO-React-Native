import type {Linking, Share} from 'react-native'
import type {ChaosMode} from '@frogpond/launch-arguments'

import {chaosFetch} from './fetch'
import {setFindingsFile} from './findings'
import {guardLinking} from './linking-guard'
import type {LineFile} from './line-file'
import {installProbe, type ProbeHost} from './probe'
import {launchSeed, seededRandom} from './random'
import {guardShare} from './share-guard'
import {watchForStalls, type StallHost} from './stall'

/** One launch's chaos settings, from its launch arguments. */
export type ChaosSettings = {
	isChaos: boolean
	seed: number
	launch: number
	mode: ChaosMode
	faultRate: number
}

/** What installing chaos changes. */
export type ChaosHost = {
	global: {fetch: typeof fetch}
	probe: ProbeHost
	linking: Pick<typeof Linking, 'openURL'>
	share: Pick<typeof Share, 'share'>
	stalls: StallHost
	tape: LineFile
	findings: LineFile
}

/** Wraps fetch, installs the probe and stall watch, and guards linking and sharing, in a chaos run only. Returns whether it did. */
export function installChaos(settings: ChaosSettings, host: ChaosHost): boolean {
	if (!settings.isChaos) {
		return false
	}
	setFindingsFile(host.findings)
	installProbe(host.probe)
	watchForStalls(host.stalls)
	guardLinking(host.linking)
	guardShare(host.share)
	host.global.fetch = chaosFetch(host.global.fetch.bind(globalThis), {
		mode: settings.mode,
		launch: settings.launch,
		random: seededRandom(launchSeed(settings.seed, settings.launch)),
		faultRate: settings.faultRate,
		tape: host.tape,
	})
	return true
}
