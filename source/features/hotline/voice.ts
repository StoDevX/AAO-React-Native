import * as Speech from 'expo-speech'
import type {Voice} from 'expo-speech'

/** The hotline's prompts are written in English, so the voice reads them as English. */
const VOICE_LANGUAGE = 'en-US'

/**
 * How natural an installed voice sounds: Premium, then Enhanced, both of which
 * a person downloads in Settings; the compact voices a device ships with rank
 * nowhere. expo-speech reports a Premium voice's quality as `Default`, so its
 * identifier is what tells it apart.
 */
function naturalness(voice: Voice): number {
	if (voice.identifier.includes('.premium.')) return 2
	if (voice.quality === 'Enhanced' || voice.identifier.includes('.enhanced.')) return 1
	return 0
}

/**
 * The most natural installed voice for the prompts' language, or undefined to
 * leave the choice to the system when only compact voices are installed.
 */
export function bestVoice(voices: ReadonlyArray<Voice>): string | undefined {
	let best = voices
		.filter((voice) => voice.language === VOICE_LANGUAGE && naturalness(voice) > 0)
		.sort((a, b) => naturalness(b) - naturalness(a))
		.at(0)
	return best?.identifier
}

/** The voice `prepareVoice` chose, read as each prompt starts. */
let chosenVoice: string | undefined

/**
 * Chooses the hotline's voice from those installed, while the phone rings, so
 * that `speak` can start at once: a prompt that waited on the choice could
 * start after a key press had already stopped it.
 */
export async function prepareVoice(): Promise<void> {
	try {
		chosenVoice = bestVoice(await Speech.getAvailableVoicesAsync())
	} catch {
		chosenVoice = undefined
	}
}

/**
 * Reads `text` aloud with the voice `prepareVoice` chose. Resolves `done` when
 * it has finished, or `stopped` when `silence` cut it off or it could not be read.
 */
export function speak(text: string): Promise<'done' | 'stopped'> {
	return new Promise((resolve) => {
		Speech.speak(text, {
			language: VOICE_LANGUAGE,
			voice: chosenVoice,
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
