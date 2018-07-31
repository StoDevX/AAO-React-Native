// @flow

import * as React from 'react'

type Props = {
	interval: number, // ms
	render: Date => React.Node,
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
		return this.props.render(this.state.now)
	}
}
