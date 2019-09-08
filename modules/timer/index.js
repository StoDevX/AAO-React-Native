// @flow

import * as React from 'react'
import moment from 'moment-timezone'
import delay from 'delay'

export function msUntilIntervalRepeat(now: number, interval: number) {
	return interval - (now % interval)
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
	_intervalId: ?IntervalID

	state = {
		now: new Date(),
		loading: false,
	}

	componentDidMount() {
		// get the time remaining until the next $interval
		let {interval} = this.props
		let nowMs = this.state.now.getTime()
		let untilNextInterval = msUntilIntervalRepeat(nowMs, interval)

		this._timeoutId = setTimeout(() => {
			this.updateTime()
			this._intervalId = setInterval(this.updateTime, interval)
		}, untilNextInterval)
	}

	componentWillUnmount() {
		this._timeoutId != null && clearTimeout(this._timeoutId)
		this._intervalId != null && clearInterval(this._intervalId)
	}

	updateTime = () => {
		this.setState(() => ({now: new Date()}))
	}

	refresh = async () => {
		let start = Date.now()
		this.setState(() => ({loading: true}))

		this.updateTime()

		let elapsed = Date.now() - start
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
