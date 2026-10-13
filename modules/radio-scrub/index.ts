import {NativeModule, requireOptionalNativeModule} from 'expo-modules-core'
import type {AudioPlayer} from 'expo-audio'

/** The native buffer's readiness and distance from the incoming broadcast. */
export type AudioEffect = 'echo' | 'reverb' | 'filter'
export type EffectParameter =
	| 'delayMs'
	| 'feedback'
	| 'resonance'
	| 'preset'
	| 'lowCut'
	| 'highCut'
	| 'occupancy'
export type ReverbPreset = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8
export type EffectSetting = {
	enabled: boolean
	amount: number
	delayMs: number
	feedback: number
	lowCut: number
	highCut: number
	resonance: number
	preset: ReverbPreset
	occupancy: number
}

/** Neutral amounts let each enabled effect fade in from dry audio. */
export const DEFAULT_EFFECT_SETTING: EffectSetting = {
	enabled: false,
	amount: 0,
	delayMs: 250,
	feedback: 25,
	lowCut: 0,
	highCut: 0,
	resonance: 0,
	preset: 1,
	occupancy: 0,
}
export type ScrubStatus = {
	ready: boolean
	bufferSeconds: number
	delaySeconds: number
	controlsAvailable: boolean
	customRoomsAvailable: boolean
	pitch: number
	quartzLocked: boolean
	bufferLimit: 'none' | 'live' | 'oldest'
	effects: Record<AudioEffect, EffectSetting>
}

export type DeckSide = 'left' | 'right'
type RadioScrubEvents = {onDeckSideChanged: (event: {side: DeckSide}) => void}

declare class RadioScrubModule extends NativeModule<RadioScrubEvents> {
	getDeckSide(): Promise<DeckSide>
	attach(player: AudioPlayer, streamURL: string, stationId: string): string
	setPlaying(playing: boolean): void
	detach(token: string): void
	beginScratch(): void
	move(rate: number): void
	release(rate: number): void
	goLive(): void
	setPitch(percent: number): void
	setQuartzLocked(locked: boolean): void
	setEffect(effect: AudioEffect, enabled: boolean, amount: number): void
	setEffectParameter(effect: AudioEffect, parameter: EffectParameter, value: number): void
	status(): ScrubStatus
}

/** An older installed binary keeps ordinary radio playback and visual scratching. */
export const radioScrub: RadioScrubModule | null = requireOptionalNativeModule('RadioScrub')
