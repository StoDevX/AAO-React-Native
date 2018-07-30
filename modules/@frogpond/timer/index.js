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

	state = {
		now: new Date(),
	}

	componentDidMount() {
		this._intervalId = setInterval(this.updateTime, this.props.interval)
	}

	componentWillUnmount() {
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
