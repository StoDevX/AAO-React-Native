import type {SymbolViewProps} from 'expo-symbols'

import {track} from '../../telemetry/track'
import type {Station} from './stations'
import {radioControl, useRadioStore, useStationPlayback} from './store'

const PLAY_ICON = {ios: 'play.fill', android: 'play_arrow'} as const
const PAUSE_ICON = {ios: 'pause.fill', android: 'pause'} as const

/**
 * The station's play, pause or stop control: what to call it, which glyph it
 * draws, and what pressing it does, counted by `surface`. The bar and the sheet
 * draw it alike.
 * Pause draws as Pause, as Control Center's does, and Stop, which only a failed
 * station offers, draws it too.
 */
export function useRadioControl(
	station: Station,
	surface: 'bar' | 'sheet',
): {
	label: string
	icon: SymbolViewProps['name']
	press: () => void
} {
	let {playState, error} = useStationPlayback(station.id)
	let play = useRadioStore((state) => state.play)
	let pause = useRadioStore((state) => state.pause)
	let stop = useRadioStore((state) => state.stop)
	let action = radioControl(playState, error)
	let press = action === 'play' ? () => play(station.id) : action === 'pause' ? pause : stop
	return {
		label: `${action === 'play' ? 'Play' : action === 'pause' ? 'Pause' : 'Stop'} ${station.stationName}`,
		icon: action === 'play' ? PLAY_ICON : PAUSE_ICON,
		press: () => {
			track({name: 'radio.control', attributes: {action, station: station.id, surface}})
			press()
		},
	}
}
