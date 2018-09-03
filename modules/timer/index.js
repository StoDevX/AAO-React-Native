// @flow

import * as React from 'react'
import moment from 'moment'

type Props = {
	interval: number, // ms
	render: ({now: Date}) => React.Node,
	moment?: boolean,
	timezone?: string,
}

type State = {
	now: Date,
}

export class Timer extends React.Component<Props, State> {
	_intervalId: ?IntervalID
	_timeoutId: ?TimeoutID

	state = {
		now: new Date(),
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

	render() {
		let {now} = this.state

		if (this.props.moment) {
			now = moment(now)
		}

		if (this.props.timezone) {
			now = now.tz(this.props.timezone)
		}

		return this.props.render({now})
	}
}
