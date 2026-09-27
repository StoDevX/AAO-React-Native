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

import type {Campus} from '../building-hours/types'
import {BuildingInfo} from './building-info'
import type {PlaceStackAction, StackEntry} from './lib/place-stack'
import {DETENT_FOR, nameOf, SHEET_DETENTS} from './lib/sheet-detents'
import type {SheetDetent} from './lib/sheet-moves'
import {cardFeaturesOptions, cardVenuesOptions} from './card-queries'
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
	let {data: features = []} = useQuery(cardFeaturesOptions(campus))
	let {data: venues = []} = useQuery(cardVenuesOptions(campus))

	let entry = stack[depth]
	let above = stack[depth + 1]
	let stacked = above ? (
		<StackedSheet
			key={`${depth + 1}-${above.kind === 'feature' ? above.id : above.name}`}
			campus={campus}
			depth={depth + 1}
			dispatch={dispatch}
			stack={stack}
			under={stop}
		/>
	) : null
	let onClose = depth === 0 ? () => dispatch({type: 'clear'}) : () => dispatch({type: 'pop', depth})

	if (entry.kind === 'feature') {
		return (
			<BuildingInfo
				building={features.find((feature) => feature.id === entry.id)}
				campus={campus}
				extraLinks={entry.link ? [entry.link] : undefined}
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

/// A place's card in a sheet over the card beneath, with the map still live
/// behind it. It opens at the height of the card beneath, covering it as Maps
/// covers one place sheet with the next; over the collapsed stop, which holds
/// only a header, it opens at the middle one.
function StackedSheet({
	under,
	...props
}: Omit<Props, 'stop'> & {under: SheetDetent}): React.ReactNode {
	// Always given: without a selection a nested sheet opens at its first
	// stop, the collapsed one.
	let [detent, setDetent] = React.useState<PresentationDetent>(
		DETENT_FOR[under === 'collapsed' ? 'medium' : under],
	)
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
