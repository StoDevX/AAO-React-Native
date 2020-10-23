import * as React from 'react'
import type {EventType} from '@frogpond/event-type'
import {addToCalendar} from './lib'
import delay from 'delay'

type Props = {
	event: EventType,
	compactMessages?: boolean,
	render: (
		message: string,
		disabled: boolean,
		onPress: () => void,
	) => React.Node,
}

type State = {
	message: string,
	disabled: boolean,
}

const VERBOSE_MESSAGES = {
	active: 'Adding event to calendar…',
	success: 'Event has been added to your calendar',
	error: 'Error. Try again?',
}

const COMPACT_MESSAGES = {
	active: 'Saving…',
	success: 'Saved',
	error: 'Error. Try again?',
}

export class AddToCalendar extends React.Component<Props, State> {
	state = {
		message: '',
		disabled: false,
	}

	addEvent = async (): void => {
		const MESSAGES = this.props.compactMessages
			? COMPACT_MESSAGES
			: VERBOSE_MESSAGES
		const {event} = this.props

		const start = Date.now()
		this.setState(() => ({message: MESSAGES.active}))

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		const elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}

		const result = await addToCalendar(event)

		if (result) {
			this.setState(() => ({message: MESSAGES.success, disabled: true}))
		} else {
			this.setState(() => ({message: MESSAGES.error, disabled: false}))
		}
	}

	render(): JSX.Element {
		return this.props.render(
			this.state.message,
			this.state.disabled,
			this.addEvent,
		)
	}
}
