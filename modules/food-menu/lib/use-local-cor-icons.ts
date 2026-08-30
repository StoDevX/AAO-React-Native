import * as React from 'react'
import {Asset} from 'expo-asset'

import type {MasterCorIconMapType} from '../types'

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

		let downloads = Object.entries(corIcons)
			.filter(([, icon]) => Boolean(icon.image))
			.map(async ([key, icon]) => {
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
			setLocalByKey(Object.fromEntries(resolved))
		})

		return () => {
			cancelled = true
		}
	}, [corIcons])

	return localByKey
}
