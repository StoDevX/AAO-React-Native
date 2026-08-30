import * as React from 'react'
import {Asset} from 'expo-asset'

import type {MasterCorIconMapType} from '../types'

function sameEntries(a: Record<string, string>, b: Record<string, string>): boolean {
	let aKeys = Object.keys(a)
	let bKeys = Object.keys(b)
	return aKeys.length === bKeys.length && aKeys.every((key) => a[key] === b[key])
}

/**
 * Downloads each of the cafe's cor-icons once and hands back its local
 * `file://` path, keyed as `corIcons` is.
 *
 * `@expo/ui`'s `Image` takes no remote URL, so the icons have to be on disk
 * before SwiftUI can draw them. There are only ever a handful — they are the
 * cafe's dietary *categories*, not one per food item — so this is a small
 * fixed cost per cafe rather than per row. `downloadAsync` reuses a file it
 * already fetched, though it stores them in the OS cache directory, which is
 * not promised to survive between sessions.
 */
export function useLocalCorIcons(corIcons: MasterCorIconMapType): Record<string, string> {
	let [localByKey, setLocalByKey] = React.useState<Record<string, string>>({})

	React.useEffect(() => {
		let cancelled = false

		let entriesToDownload = Object.entries(corIcons).filter(([, icon]) => Boolean(icon.image))

		// Nothing to fetch -- leave the existing state alone rather than
		// resolving to a freshly-allocated empty object, which would be a new
		// reference and trigger a render for no observable change.
		if (entriesToDownload.length === 0) {
			return
		}

		let downloads = entriesToDownload.map(async ([key, icon]) => {
			try {
				let asset = await Asset.fromURI(icon.image).downloadAsync()
				return asset.localUri ? ([key, asset.localUri] as const) : null
			} catch {
				// One icon that will not download is not worth failing a menu
				// over; that row simply shows one fewer icon.
				return null
			}
		})

		void Promise.all(downloads).then((pairs) => {
			if (cancelled) {
				return
			}
			let resolved = pairs.filter((pair): pair is readonly [string, string] => pair !== null)
			let next = Object.fromEntries(resolved)

			// A caller that hands down a new-but-equivalent `corIcons` object
			// every render (an inline default, say) would otherwise re-run this
			// effect and set a new object identity forever: render -> effect ->
			// setState -> render. Keeping the previous reference when the content
			// hasn't changed lets React bail out of that render.
			setLocalByKey((prev) => (sameEntries(prev, next) ? prev : next))
		})

		return () => {
			cancelled = true
		}
	}, [corIcons])

	return localByKey
}
