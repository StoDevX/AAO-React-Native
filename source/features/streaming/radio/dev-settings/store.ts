import AsyncStorage from '@react-native-async-storage/async-storage'
import {create} from 'zustand'
import {createJSONStorage, persist} from 'zustand/middleware'

import {CAPTION_DISPLAY_DELAY_MS} from '../captions/caption-delay'

/** How the line being spoken is shown: as it comes, without its last words, or with them dimmed. */
export type CaptionPresentation = 'live' | 'hold-back' | 'two-tone'

/** The most words held back or dimmed. */
const MAX_HELD_BACK_WORDS = 3

/** The display delay moves in steps of this, and goes no higher than `MAX_DELAY_MS`. */
const DELAY_STEP_MS = 500
const MAX_DELAY_MS = 15_000

type RadioDevState = {
	captionPresentation: CaptionPresentation
	/** How many of the last words of the live line are held back or dimmed. */
	heldBackWords: number
	/** How long captions wait before they show. */
	captionDelayMs: number

	setCaptionPresentation: (presentation: CaptionPresentation) => void
	setHeldBackWords: (words: number) => void
	setCaptionDelayMs: (delayMs: number) => void
	/** Puts every setting back to what the app does without them. */
	reset: () => void
}

const DEFAULTS = {
	captionPresentation: 'hold-back',
	heldBackWords: 3,
	captionDelayMs: CAPTION_DISPLAY_DELAY_MS,
} as const

/**
 * Settings for trying out how the radio's captions are shown, reached from the
 * station menu in dev mode. They persist, so a change survives a relaunch, and
 * the defaults are the app's own behaviour.
 */
export const useRadioDevStore = create<RadioDevState>()(
	persist(
		(set) => ({
			...DEFAULTS,
			setCaptionPresentation: (captionPresentation) => set({captionPresentation}),
			setHeldBackWords: (words) =>
				set({heldBackWords: Math.min(MAX_HELD_BACK_WORDS, Math.max(0, Math.round(words)))}),
			setCaptionDelayMs: (delayMs) =>
				set({
					captionDelayMs: Math.min(
						MAX_DELAY_MS,
						Math.max(0, Math.round(delayMs / DELAY_STEP_MS) * DELAY_STEP_MS),
					),
				}),
			reset: () => set(DEFAULTS),
		}),
		{
			name: 'radio-dev-settings',
			storage: createJSONStorage(() => AsyncStorage),
			version: 1,
			partialize: (state) => ({
				captionPresentation: state.captionPresentation,
				heldBackWords: state.heldBackWords,
				captionDelayMs: state.captionDelayMs,
			}),
		},
	),
)
