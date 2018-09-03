// @flow

import * as React from 'react'
import moment from 'moment-timezone'
import delay from 'delay'

type Props = {
	interval: number, // ms
	timezone?: string,
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
	_intervalId: ?IntervalID
	_timeoutId: ?TimeoutID

	state = {
		now: new Date(),
		loading: false,
	}

	componentDidMount() {
		this._intervalId = setInterval(this.updateTime, this.props.interval)

		// get the time remaining until the next $interval
		let {interval} = this.props
		let nowMs = this.state.now.getTime()
		let untilNextInterval = interval - (nowMs % interval)

		this._timeoutId = setTimeout(() => {
			this.updateTime()
			this._intervalId = setInterval(this.updateTime, this.props.interval)
		}, untilNextInterval)
	}

	componentWillUnmount() {
		if (this._timeoutId) {
			clearTimeout(this._timeoutId)
		}

		if (this._intervalId) {
			clearInterval(this._intervalId)
		}
	}

	updateTime = () => {
		this.setState(() => ({now: new Date()}))
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

		return this.props.render({now, loading, refresh: this.refresh})
	}
}
