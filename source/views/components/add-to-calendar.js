// @flow
import * as React from 'react'
import type {EventType} from '../calendar/types'
import {addToCalendar} from '../calendar/calendar-util'
import delay from 'delay'

type Props = {
	event: EventType,
	compactMessages?: boolean,
	render: ({
		message: string,
		disabled: boolean,
		onPress: () => any,
	}) => React.Node,
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

const COMPACT_MESSAGES: $Shape<typeof VERBOSE_MESSAGES> = {
	active: 'Saving…',
	success: 'Saved',
	error: 'Error. Try again?',
}

export class AddToCalendar extends React.Component<Props, State> {
	state = {
		message: '',
		disabled: false,
	}

	addEvent = async () => {
		let MESSAGES = this.props.compactMessages
			? COMPACT_MESSAGES
			: VERBOSE_MESSAGES
		let {event} = this.props

		let start = Date.now()
		this.setState(() => ({message: MESSAGES.active}))

		// wait 0.5 seconds – if we let it go at normal speed, it feels broken.
		let elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}

		let result = await addToCalendar(event)

		if (result) {
			this.setState(() => ({message: MESSAGES.success, disabled: true}))
		} else {
			this.setState(() => ({message: MESSAGES.error, disabled: false}))
		}
	}

	render() {
		return this.props.render({
			message: this.state.message,
			disabled: this.state.disabled,
			onPress: this.addEvent,
		})
	}
}
