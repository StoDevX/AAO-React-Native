import * as Speech from 'expo-speech'

/** The hotline's prompts are written in English, so the voice reads them as English. */
const VOICE_LANGUAGE = 'en-US'

/**
 * Reads `text` aloud with the device's own voice. Resolves `done` when it has
 * finished, or `stopped` when `silence` cut it off or it could not be read.
 */
export function speak(text: string): Promise<'done' | 'stopped'> {
	return new Promise((resolve) => {
		Speech.speak(text, {
			language: VOICE_LANGUAGE,
			onDone: () => resolve('done'),
			onStopped: () => resolve('stopped'),
			onError: () => resolve('stopped'),
		})
	})
}

/** Stops whatever the voice is reading. */
export function silence(): void {
	void Speech.stop()
}
