import * as React from 'react'
import {timezone} from '@frogpond/constants'
import {useMomentTimer} from '@frogpond/timer'

import type {StackEntry} from '../lib/also-here'
import type {PlaceTile} from '../lib/place-tiles'
import {PlacesSection} from './places-section'

type Props = {
	tiles: Array<PlaceTile>
	onOpen: (entry: StackEntry) => void
}

/// What else is at a place, as tiles with each one's live status, after Maps'
/// "Also at This Location". Most places have nothing else, so the section
/// draws nothing and keeps no clock.
export function AlsoHereSection({tiles, onOpen}: Props): React.ReactNode {
	if (tiles.length === 0) {
		return null
	}
	return <AlsoHereTiles onOpen={onOpen} tiles={tiles} />
}

/// The section itself, kept current: the minute's tick redraws the statuses.
function AlsoHereTiles({tiles, onOpen}: Props): React.ReactNode {
	let {now} = useMomentTimer({intervalMs: 60000, timezone: timezone()})
	return (
		<PlacesSection
			id="also-here"
			now={now}
			onOpen={onOpen}
			tiles={tiles}
			title="Also at This Location"
		/>
	)
}
