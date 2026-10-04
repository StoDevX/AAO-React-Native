import * as React from 'react'

import type {MapPins} from './lib/map-pins'

/// Calls `frame` once for each frame request the picker makes, and never
/// otherwise. The request's key rides on pins that come and go -- a search
/// after Cancel, or typing after Back, brings pins back carrying a key already
/// framed -- so the last key framed is remembered here rather than read off
/// the pins' change.
///
/// A request made while a place is open is dropped, not deferred: the camera
/// is the open place's. Tapping a row mid-search opens its card, which ends
/// the editing, and a search that ends with text asks for its results.
export function useFrameRequests(
	pins: MapPins | null,
	placeOpen: boolean,
	frame: (pins: MapPins) => void,
): void {
	let framedKey = React.useRef(0)
	let onRequest = React.useEffectEvent((requested: MapPins) => {
		if (!placeOpen) {
			frame(requested)
		}
	})
	React.useEffect(() => {
		if (pins && pins.frameKey > framedKey.current) {
			framedKey.current = pins.frameKey
			onRequest(pins)
		}
	}, [pins])
}
