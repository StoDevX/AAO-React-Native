import {useEffect, useState} from 'react'
import {radioScrub, type DeckSide} from '@frogpond/radio-scrub'

/** The turntable follows the phone’s physical top without polling or resetting playback. */
export function useDeckSide(): DeckSide {
	let [side, setSide] = useState<DeckSide>('left')
	useEffect(() => {
		let native = radioScrub
		if (!native?.getDeckSide) return
		let active = true
		let receivedEvent = false
		let subscription = native.addListener('onDeckSideChanged', (event) => {
			receivedEvent = true
			if (active) setSide(event.side)
		})
		void native
			.getDeckSide()
			.then((initial) => {
				if (active && !receivedEvent) setSide(initial)
			})
			.catch(() => {
				if (active && !receivedEvent) setSide('left')
			})
		return () => {
			active = false
			subscription.remove()
		}
	}, [])
	return side
}
