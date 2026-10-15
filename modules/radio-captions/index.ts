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
	start(url: string, locale: string): Promise<void>
	stop(): void
	captionStyle(): CaptionStyle
}

const RadioCaptions = requireNativeModule<RadioCaptionsModule>('RadioCaptions')

/**
 * Starts captioning the stream at `url` in `locale`, replacing any captioning already running.
 * Resolves once the speech model is ready, which may take a download; rejects if `url` is invalid.
 */
export function startCaptions(url: string, locale: string): Promise<void> {
	return RadioCaptions.start(url, locale)
}

/** Stops captioning. Safe to call at any time, including when nothing is running. */
export function stopCaptions(): void {
	RadioCaptions.stop()
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
