import {NativeModule, requireNativeModule} from 'expo-modules-core'

interface TelephoneTonesModule extends NativeModule {
	playKeyTone(key: string): void
	startRingback(): void
	stopRingback(): void
	playCallEnded(): Promise<void>
	stopTones(): void
}

const TelephoneTones = requireNativeModule<TelephoneTonesModule>('TelephoneTones')

/** The touch-tone of `key` (`0`–`9`, `*`, `#`), as a keypad plays it on a press. */
export function playKeyTone(key: string): void {
	TelephoneTones.playKeyTone(key)
}

/** The ringing a caller hears while the other end rings, until `stopRingback`. */
export function startRingback(): void {
	TelephoneTones.startRingback()
}

/** Stops the ringing. */
export function stopRingback(): void {
	TelephoneTones.stopRingback()
}

/** The three beeps of a call that has ended; resolves once they have played. */
export function playCallEnded(): Promise<void> {
	return TelephoneTones.playCallEnded()
}

/** Stops whatever tone is playing. */
export function stopTones(): void {
	TelephoneTones.stopTones()
}
