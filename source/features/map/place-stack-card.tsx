import * as React from 'react'
import {BottomSheet, Group} from '@expo/ui/swift-ui'
import {
	background,
	presentationBackgroundInteraction,
	presentationDetents,
	presentationDragIndicator,
	type PresentationDetent,
} from '@expo/ui/swift-ui/modifiers'
import {useQuery} from '@tanstack/react-query'
import * as c from '@frogpond/colors'

import {buildingsOptions} from '../building-hours/query'
import type {Campus} from '../building-hours/types'
import {BuildingInfo} from './building-info'
import type {PlaceStackAction, StackEntry} from './lib/place-stack'
import {DETENT_FOR, nameOf, SHEET_DETENTS} from './lib/sheet-detents'
import type {SheetDetent} from './lib/sheet-moves'
import {mapDataOptions} from './query'
import {VenueCard} from './venue-card'

type Props = {
	stack: Array<StackEntry>
	/// Which entry of the stack this card shows.
	depth: number
	campus: Campus
	dispatch: (action: PlaceStackAction) => void
	/// The stop of the sheet this card is in.
	stop: SheetDetent
}

/**
 * The card for one place in the stack, with the next place's card stacked
 * over it in a sheet of its own, as Maps stacks place sheets. Closing a
 * stacked card, or swiping its sheet away, returns to the card beneath.
 */
export function PlaceStackCard({stack, depth, campus, dispatch, stop}: Props): React.ReactNode {
	// The screens' own queries, so every card reads the same warm caches.
	let {data: features = []} = useQuery(mapDataOptions(campus))
	let {data: venues = []} = useQuery({...buildingsOptions(campus), enabled: campus === 'stolaf'})

	let entry = stack[depth]
	let above = stack[depth + 1]
	let stacked = above ? (
		<StackedSheet
			key={`${depth + 1}-${above.kind === 'feature' ? above.id : above.name}`}
			campus={campus}
			depth={depth + 1}
			dispatch={dispatch}
			stack={stack}
		/>
	) : null
	let onClose = depth === 0 ? () => dispatch({type: 'clear'}) : () => dispatch({type: 'pop', depth})

	if (entry.kind === 'feature') {
		return (
			<BuildingInfo
				building={features.find((feature) => feature.id === entry.id)}
				campus={campus}
				onClose={onClose}
				onOpen={(next) => dispatch({type: 'push', entry: next})}
				stacked={stacked}
				stop={stop}
			/>
		)
	}

	let venue = venues.find((candidate) => candidate.name === entry.name)
	let place = features.find((feature) => feature.id === venue?.building)
	return (
		<VenueCard
			extraLinks={entry.link ? [entry.link] : undefined}
			onClose={onClose}
			placeName={place?.properties.name ?? null}
			stacked={stacked}
			stop={stop}
			venue={venue}
		/>
	)
}

/// A place's card in a sheet over the card beneath: the map sheet's stops,
/// opening at the middle one, with the map still live behind it.
function StackedSheet(props: Omit<Props, 'stop'>): React.ReactNode {
	// Given, or a nested sheet opens at its first stop, the collapsed one.
	let [detent, setDetent] = React.useState<PresentationDetent>(DETENT_FOR.medium)
	let {depth, dispatch} = props
	return (
		<BottomSheet
			isPresented={true}
			onIsPresentedChange={(presented) => {
				if (!presented) {
					dispatch({type: 'pop', depth})
				}
			}}
		>
			<Group
				modifiers={[
					background(c.systemGroupedBackground),
					presentationDetents(SHEET_DETENTS, {selection: detent, onSelectionChange: setDetent}),
					presentationDragIndicator('visible'),
					presentationBackgroundInteraction('enabled'),
				]}
			>
				<PlaceStackCard {...props} stop={nameOf(detent)} />
			</Group>
		</BottomSheet>
	)
}
