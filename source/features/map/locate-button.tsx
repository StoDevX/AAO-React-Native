import type * as React from 'react'

export type LocateButtonProps = {
	/** How far up the screen the sheet reaches, which the button sits above. */
	sheetHeight: number
	/** Moves the map to the reader's position. */
	onLocate: (longitude: number, latitude: number) => void
}

/**
 * Android's my-location button, floating above the map's sheet as Google
 * Maps' does. iOS shows the reader's location without one, as Apple Maps'
 * sheet does, so it draws nothing here.
 */
export function LocateButton(_props: LocateButtonProps): React.ReactNode {
	return null
}
