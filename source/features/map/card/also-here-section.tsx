import * as React from 'react'
import {timezone} from '@frogpond/constants'
import {useMomentTimer} from '@frogpond/timer'

import type {StackEntry} from '../lib/also-here'
import type {PlaceTile} from '../lib/place-tiles'
import {PlacesSection} from './places-section'

/// What else is at a place, as tiles with each one's live status, after Maps'
/// "Also at This Location". The More grid groups them into Places and Offices.
export function AlsoHereSection({
	tiles,
	onOpen,
}: {
	tiles: Array<PlaceTile>
	onOpen: (entry: StackEntry) => void
}): React.ReactNode {
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})
	if (tiles.length === 0) {
		return null
	}
	return (
		<PlacesSection
			groups={[
				{title: 'Places', tiles: tiles.filter((tile) => tile.kind !== 'office')},
				{title: 'Offices', tiles: tiles.filter((tile) => tile.kind === 'office')},
			]}
			id="also-here"
			now={now}
			onOpen={onOpen}
			tiles={tiles}
			title="Also at This Location"
		/>
	)
}
