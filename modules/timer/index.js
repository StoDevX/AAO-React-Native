// @flow

import * as React from 'react'
import moment from 'moment-timezone'
import delay from 'delay'

export function msUntilIntervalRepeat(now: number, interval: number) {
	let next = now
	while (next % interval !== 0) {
		next += 1
	}
	return next - now
}

type Props = {
	interval: number, // ms
	timezone?: string,
	invoke?: () => mixed,
} & (
	| {
			moment: true,
			render: ({
				now: moment,
				loading: boolean,
				refresh: () => mixed,
			}) => React.Node,
	  }
	| {
			moment: false,
			render: ({
				now: Date,
				loading: boolean,
				refresh: () => mixed,
			}) => React.Node,
	  }
)

type State = {
	now: Date,
	loading: boolean,
}

export class Timer extends React.Component<Props, State> {
	_timeoutId: ?TimeoutID

	state = {
		now: new Date(),
		loading: false,
	}

	componentDidMount() {
		this.queue()
	}

	componentWillUnmount() {
		// eslint-disable-next-line no-eq-null
		this._timeoutId != null && clearTimeout(this._timeoutId)
	}

	queue = () => {
		// get the time remaining until the next $interval
		let {interval} = this.props
		let nowMs = this.state.now.getTime()
		let untilNextInterval = msUntilIntervalRepeat(nowMs, interval)

		this._timeoutId = setTimeout(this.updateTime, untilNextInterval)
	}

	updateTime = () => {
		this.setState(() => ({now: new Date()}), this.queue)
	}

	refresh = async () => {
		const start = Date.now()
		this.setState(() => ({loading: true}))

		this.updateTime()

		const elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}

		this.setState(() => ({loading: false}))
	}

	render() {
		let {now, loading} = this.state

		if (this.props.moment) {
			now = moment(now)

			if (this.props.timezone) {
				now = now.tz(this.props.timezone)
			}
		}

		if (this.props.invoke) {
			this.props.invoke()
		}

		return this.props.render({now, loading, refresh: this.refresh})
	}
}
