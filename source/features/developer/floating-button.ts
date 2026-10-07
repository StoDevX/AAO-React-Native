import * as Sentry from '@sentry/react-native'
import {Asset} from 'expo-asset'
import {isDebugSwiftAvailable, setFloatingButtonEnabled} from '@frogpond/debug-tools'
import type {FloatingButtonImages} from '@frogpond/debug-tools'

import {appIcons} from '../../../images/icons'
import {useDeveloperStore} from './store'

/**
 * The Old Main Retro icon's previews as files on the device, which is what
 * native code can load. In a Debug build they are served by Metro, so this
 * downloads them first.
 */
async function buttonImages(): Promise<FloatingButtonImages> {
	let {light, dark} = appIcons['old-main-retro']
	let [lightAsset, darkAsset] = await Promise.all([
		Asset.fromModule(light).downloadAsync(),
		Asset.fromModule(dark).downloadAsync(),
	])
	return {light: lightAsset.localUri ?? lightAsset.uri, dark: darkAsset.localUri ?? darkAsset.uri}
}

async function pushFloatingButton(): Promise<void> {
	if (!useDeveloperStore.getState().floatingButtonEnabled) {
		await setFloatingButtonEnabled(false)
		return
	}
	await setFloatingButtonEnabled(true, await buttonImages())
}

/**
 * Show or hide DebugSwift's floating button as the switch says. The sync does
 * this on its own; turning DebugSwift on calls it too, since the button can
 * only show once DebugSwift is running.
 */
export function refreshFloatingButton(): void {
	// A debugging aid; a failure is worth knowing about, not showing.
	pushFloatingButton().catch((error: unknown) => {
		Sentry.captureException(error)
	})
}

/**
 * Keep DebugSwift's floating button in step with the Developer screen's
 * switch: once the store has loaded, then on every change. Does nothing in a
 * build without DebugSwift.
 *
 * Returns a function that stops it.
 */
export function startFloatingButtonSync(): () => void {
	if (!isDebugSwiftAvailable) {
		return () => undefined
	}

	let stopOnHydration = useDeveloperStore.persist.onFinishHydration(refreshFloatingButton)
	let stopOnChange = useDeveloperStore.subscribe((state, previous) => {
		if (state.floatingButtonEnabled !== previous.floatingButtonEnabled) {
			refreshFloatingButton()
		}
	})
	if (useDeveloperStore.persist.hasHydrated()) {
		refreshFloatingButton()
	}

	return () => {
		stopOnHydration()
		stopOnChange()
	}
}
