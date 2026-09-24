import * as React from 'react'
import type {EventType} from '@frogpond/event-type'
import {addToCalendar} from './lib'
import delay from 'delay'

type Props = {
	event: EventType
	compactMessages?: boolean
	render: (args: {message: string; disabled: boolean; onPress: () => void}) => React.ReactNode
}

const VERBOSE_MESSAGES = {
	active: 'Adding event to calendar…',
	added: 'Added to Calendar',
	error: 'Error. Try again?',
}

const COMPACT_MESSAGES = {
	active: 'Saving…',
	added: 'Added to Calendar',
	error: 'Error. Try again?',
}

/**
 * Adds `event` through the system editor. Once saved, the button says so and
 * stays disabled until the sheet closes: the app has no calendar access, so
 * it can't tell whether the event is still there, and a second tap would
 * only add a copy.
 */
export function AddToCalendar(props: Props): React.ReactNode {
	let {event, compactMessages, render} = props
	let MESSAGES = compactMessages ? COMPACT_MESSAGES : VERBOSE_MESSAGES

	let [message, setMessage] = React.useState('')
	let [disabled, setDisabled] = React.useState(false)

	let onPress = React.useCallback(async () => {
		let start = Date.now()
		setMessage(MESSAGES.active)
		setDisabled(true)

		let result = await addToCalendar(event)

		let elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}

		if (result === 'saved') {
			setMessage(MESSAGES.added)
		} else if (result === 'cancelled') {
			setMessage('')
			setDisabled(false)
		} else {
			setMessage(MESSAGES.error)
			setDisabled(false)
		}
	}, [event, MESSAGES])

	return render({message, disabled, onPress})
}
