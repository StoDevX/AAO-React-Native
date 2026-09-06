import * as React from 'react'
import type {EventType} from '@frogpond/event-type'
import {addToCalendar, openCalendarEvent} from './lib'
import delay from 'delay'

type Props = {
	event: EventType
	compactMessages?: boolean
	render: (args: {message: string; disabled: boolean; onPress: () => void}) => React.ReactNode
}

type State = {
	message: string
	disabled: boolean
	savedEventId: string | null
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

export class AddToCalendar extends React.Component<Props, State> {
	state: State = {
		message: '',
		disabled: false,
		savedEventId: null,
	}

	addEvent = async (): Promise<void> => {
		const MESSAGES = this.props.compactMessages ? COMPACT_MESSAGES : VERBOSE_MESSAGES
		const {event} = this.props

		const start = Date.now()
		this.setState(() => ({message: MESSAGES.active}))

		const result = await addToCalendar(event)

		const elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}

		if (result.status === 'saved') {
			this.setState(() => ({
				message: MESSAGES.success,
				disabled: false,
				savedEventId: result.eventId,
			}))
		} else if (result.status === 'cancelled') {
			this.setState(() => ({message: '', disabled: false, savedEventId: null}))
		} else {
			this.setState(() => ({message: MESSAGES.error, disabled: false, savedEventId: null}))
		}
	}

	openEvent = async (): Promise<void> => {
		if (this.state.savedEventId) {
			await openCalendarEvent(this.state.savedEventId)
		}
	}

	handlePress = (): void => {
		if (this.state.savedEventId) {
			this.openEvent()
		} else {
			this.addEvent()
		}
	}

	render(): React.ReactNode {
		return this.props.render({
			message: this.state.message,
			disabled: this.state.disabled,
			onPress: this.handlePress,
		})
	}
}
