import * as React from 'react'
import type {EventType} from '@frogpond/event-type'
import {addToCalendar, openCalendarEvent} from './lib'
import {useSavedEventsStore} from './store'
import delay from 'delay'

type Props = {
	event: EventType
	eventKey: string
	compactMessages?: boolean
	render: (args: {message: string; disabled: boolean; onPress: () => void}) => React.ReactNode
}

const VERBOSE_MESSAGES = {
	active: 'Adding event to calendar…',
	success: 'View in Calendar',
	error: 'Error. Try again?',
}

const COMPACT_MESSAGES = {
	active: 'Saving…',
	success: 'View in Calendar',
	error: 'Error. Try again?',
}

export function AddToCalendar(props: Props): React.ReactNode {
	let {event, eventKey, compactMessages, render} = props
	let MESSAGES = compactMessages ? COMPACT_MESSAGES : VERBOSE_MESSAGES

	let {getSavedEventId, markSaved, markRemoved} = useSavedEventsStore()
	let persistedEventId = getSavedEventId(eventKey)

	let [message, setMessage] = React.useState(persistedEventId ? MESSAGES.success : '')
	let [disabled, setDisabled] = React.useState(false)
	let [savedEventId, setSavedEventId] = React.useState<string | null>(persistedEventId)

	let addEvent = React.useCallback(async () => {
		let start = Date.now()
		setMessage(MESSAGES.active)

		let result = await addToCalendar(event)

		let elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}

		if (result.status === 'saved') {
			setMessage(MESSAGES.success)
			setDisabled(false)
			setSavedEventId(result.eventId)
			markSaved(eventKey, result.eventId)
		} else if (result.status === 'cancelled') {
			setMessage('')
			setDisabled(false)
			setSavedEventId(null)
		} else {
			setMessage(MESSAGES.error)
			setDisabled(false)
			setSavedEventId(null)
		}
	}, [event, eventKey, markSaved, MESSAGES])

	let openEvent = React.useCallback(async () => {
		if (savedEventId) {
			let result = await openCalendarEvent(savedEventId)
			if (result === 'deleted') {
				setMessage('')
				setDisabled(false)
				setSavedEventId(null)
				markRemoved(eventKey)
			}
		}
	}, [savedEventId, eventKey, markRemoved])

	let handlePress = React.useCallback(() => {
		if (savedEventId) {
			openEvent()
		} else {
			addEvent()
		}
	}, [savedEventId, openEvent, addEvent])

	return render({message, disabled, onPress: handlePress})
}
