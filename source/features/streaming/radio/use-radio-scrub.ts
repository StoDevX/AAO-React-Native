import {useEffect} from 'react'
import type {AudioPlayer} from 'expo-audio'
import {create} from 'zustand'
import {
	radioScrub,
	type ScrubStatus,
	type AudioEffect,
	type EffectParameter,
	DEFAULT_EFFECT_SETTING,
} from '@frogpond/radio-scrub'
import {DEGREES_PER_SECOND} from './record-speed'

type ScrubPlayback = ScrubStatus & {stationId: string | null; token: string | null}

const EMPTY: ScrubPlayback = {
	stationId: null,
	token: null,
	ready: false,
	bufferSeconds: 0,
	delaySeconds: 0,
	controlsAvailable: false,
	customRoomsAvailable: false,
	pitch: 0,
	quartzLocked: true,
	bufferLimit: 'none',
	effects: {
		echo: {...DEFAULT_EFFECT_SETTING},
		reverb: {...DEFAULT_EFFECT_SETTING},
		filter: {...DEFAULT_EFFECT_SETTING},
	},
}

/** Transient native buffer status; no audio or playback position survives a relaunch. */
export const useScrubPlayback = create<ScrubPlayback>(() => EMPTY)

/** Fill parameter defaults when Metro is still attached to an older native build. */
function completeStatus(status: ScrubStatus): ScrubStatus {
	return {
		...status,
		customRoomsAvailable: status.customRoomsAvailable ?? false,
		effects: {
			echo: {...DEFAULT_EFFECT_SETTING, ...status.effects?.echo},
			filter: {...DEFAULT_EFFECT_SETTING, ...status.effects?.filter},
			reverb: {...DEFAULT_EFFECT_SETTING, ...status.effects?.reverb},
		},
	}
}

/** Attach to the existing player and read four small status updates a second. */
export function useRadioScrub(
	player: AudioPlayer,
	stationId: string,
	playing: boolean,
	streamURL: string,
): boolean {
	let delayed = useScrubPlayback(
		(state) => state.stationId === stationId && state.delaySeconds >= 0.25,
	)
	useEffect(() => {
		let native = radioScrub
		if (!native) return
		let token = native.attach(player, streamURL, stationId)
		let update = () => {
			let status = completeStatus(native.status())
			useScrubPlayback.setState({
				...EMPTY,
				...status,
				stationId,
				token,
				bufferSeconds: Math.floor(status.bufferSeconds * 10) / 10,
				delaySeconds: Math.round(status.delaySeconds * 10) / 10,
			})
		}
		update()
		let timer = setInterval(update, 250)
		return () => {
			clearInterval(timer)
			native.detach(token)
			if (useScrubPlayback.getState().token === token) useScrubPlayback.setState(EMPTY)
		}
	}, [player, stationId, streamURL])
	useEffect(() => {
		radioScrub?.setPlaying(playing)
		if (!playing) radioScrub?.release(1)
	}, [player, stationId, streamURL, playing])
	return delayed
}

/** Whether this station has enough captured audio for a scratch. */
export function canScratchAudio(stationId: string): boolean {
	let state = useScrubPlayback.getState()
	return state.stationId === stationId && state.ready && state.bufferSeconds >= 0.1
}

/** Refresh scalar settings immediately after a command; periodic status follows the audio cursor. */
function updateControls(command: () => void): void {
	command()
	if (radioScrub) useScrubPlayback.setState(completeStatus(radioScrub.status()))
}

/** Commands contain only scalar rates; PCM stays on the audio thread. */
export const audioScratch = {
	begin: (): void => radioScrub?.beginScratch(),
	move: (degreesPerSecond: number): void => radioScrub?.move(degreesPerSecond / DEGREES_PER_SECOND),
	release: (degreesPerSecond: number): void =>
		radioScrub?.release(degreesPerSecond / DEGREES_PER_SECOND),
	goLive: (): void => updateControls(() => radioScrub?.goLive()),
	setPitch: (percent: number): void => updateControls(() => radioScrub?.setPitch(percent)),
	setQuartzLocked: (locked: boolean): void =>
		updateControls(() => radioScrub?.setQuartzLocked(locked)),
	setEffectParameter: (effect: AudioEffect, parameter: EffectParameter, value: number): void =>
		updateControls(() => radioScrub?.setEffectParameter?.(effect, parameter, value)),
	setEffect: (effect: AudioEffect, enabled: boolean, amount: number): void =>
		updateControls(() => radioScrub?.setEffect(effect, enabled, amount)),
}

/** Only the station actually attached to the native buffer may adjust its audio. */
export function scrubControlsAvailable(
	state: ScrubStatus & {stationId: string | null},
	stationId: string,
): boolean {
	return (
		state.stationId === stationId &&
		state.controlsAvailable &&
		state.ready &&
		state.bufferSeconds > 0
	)
}

export function useScrubControlsAvailable(stationId: string): boolean {
	return useScrubPlayback((state) => scrubControlsAvailable(state, stationId))
}

/** Recheck ownership at event time, including events delivered after browsing away. */
export const djAudio = {
	pitch(stationId: string, percent: number): void {
		if (scrubControlsAvailable(useScrubPlayback.getState(), stationId)) {
			audioScratch.setPitch(percent)
		}
	},
	quartz(stationId: string, locked: boolean): void {
		if (scrubControlsAvailable(useScrubPlayback.getState(), stationId)) {
			audioScratch.setQuartzLocked(locked)
		}
	},
	effect(stationId: string, effect: AudioEffect, enabled: boolean, amount: number): void {
		if (scrubControlsAvailable(useScrubPlayback.getState(), stationId)) {
			audioScratch.setEffect(effect, enabled, amount)
		}
	},
	parameter(
		stationId: string,
		effect: AudioEffect,
		parameter: EffectParameter,
		value: number,
	): void {
		if (scrubControlsAvailable(useScrubPlayback.getState(), stationId)) {
			audioScratch.setEffectParameter(effect, parameter, value)
		}
	},
	live(stationId: string): void {
		if (useScrubPlayback.getState().stationId === stationId) audioScratch.goLive()
	},
	reset(): void {
		let native = radioScrub
		if (!native) return
		let {effects} = useScrubPlayback.getState()
		if (native.setEffect) {
			for (let effect of ['echo', 'reverb', 'filter'] as const) {
				native.setEffect(effect, false, effects[effect].amount)
			}
		}
		// Go Live also ends a held scratch, centers pitch, and enables quartz.
		audioScratch.goLive()
	},
}
