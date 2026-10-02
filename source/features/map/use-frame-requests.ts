import * as React from 'react'

import type {MapPins} from './lib/map-pins'

/// Calls `frame` once for each frame request the picker makes, and never
/// otherwise. The request's key rides on pins that come and go -- a search
/// after Cancel, or typing after Back, brings pins back carrying a key already
/// framed -- so the last key framed is remembered here rather than read off
/// the pins' change.
export function useFrameRequests(pins: MapPins | null, frame: (pins: MapPins) => void): void {
	let framedKey = React.useRef(0)
	let onFrame = React.useEffectEvent(frame)
	React.useEffect(() => {
		if (pins && pins.frameKey > framedKey.current) {
			framedKey.current = pins.frameKey
			onFrame(pins)
		}
	}, [pins])
}
