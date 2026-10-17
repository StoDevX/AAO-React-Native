import {NativeModule, requireNativeModule} from 'expo-modules-core'

/** A line of speech as the recognizer hears it: `volatile` is still being revised, `final` is settled. */
export type CaptionEvent = {kind: 'volatile' | 'final'; text: string}

/** What the captioner is doing. `unavailable` is its last state: captions will not resume. */
export type CaptionsEngineState =
	| {kind: 'downloading' | 'reconnecting' | 'captioning' | 'music'}
	| {kind: 'unavailable'; reason: string}

/** The viewer's Subtitles & Captioning choices, with colors as `#RRGGBBAA`. */
export type CaptionStyle = {
	foreground: string
	background: string
	fontFamily: string | null
	fontScale: number
}

type RadioCaptionsEvents = {
	onCaption: (event: CaptionEvent) => void
	onState: (state: CaptionsEngineState) => void
}

declare class RadioCaptionsModule extends NativeModule<RadioCaptionsEvents> {
	start(url: string, locale: string, startId: number): Promise<void>
	stop(throughStartId: number): void
	captionStyle(): CaptionStyle
}

const RadioCaptions = requireNativeModule<RadioCaptionsModule>('RadioCaptions')

/**
 * Numbers each start. `stopCaptions` tells the native side the latest number, so a stop that
 * arrives before a start's body has run on the native queue still cancels that start, while a
 * start made after the stop is left alone.
 */
let latestStartId = 0

/**
 * Starts captioning the stream at `url` in `locale`, replacing any captioning already running.
 * Resolves once the speech model is ready, which may take a download; rejects if `url` is not
 * an http(s) address. Resolves without captioning if `stopCaptions` was called meanwhile.
 */
export function startCaptions(url: string, locale: string): Promise<void> {
	latestStartId += 1
	return RadioCaptions.start(url, locale, latestStartId)
}

/** Stops captioning, including a start still preparing. Safe to call at any time, even when nothing is running. */
export function stopCaptions(): void {
	RadioCaptions.stop(latestStartId)
}

/** The caption appearance the viewer chose in Settings. */
export function captionStyle(): CaptionStyle {
	return RadioCaptions.captionStyle()
}

/** Listens for caption lines. Returns the function that stops listening. */
export function addCaptionListener(listener: (event: CaptionEvent) => void): () => void {
	const subscription = RadioCaptions.addListener('onCaption', listener)
	return () => subscription.remove()
}

/** Listens for changes in what the captioner is doing. Returns the function that stops listening. */
export function addCaptionStateListener(
	listener: (state: CaptionsEngineState) => void,
): () => void {
	const subscription = RadioCaptions.addListener('onState', listener)
	return () => subscription.remove()
}
