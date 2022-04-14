import * as React from 'react'
import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'
import delay from 'delay'

export function msUntilIntervalRepeat(now: number, interval: number) {
	return interval - (now % interval)
}

type Props = {
	interval: number // ms
	timezone?: string
	invoke?: () => unknown
} & (
	| {
			moment: true
			render: (state: {
				now: Moment
				loading: boolean
				refresh: () => void
			}) => React.ReactNode
	  }
	| {
			moment: false
			render: (state: {
				now: Date
				loading: boolean
				refresh: () => void
			}) => React.ReactNode
	  }
)

type State = {
	now: Date
	loading: boolean
}

export class Timer extends React.Component<Props, State> {
	_timeoutId?: NodeJS.Timeout
	_intervalId?: NodeJS.Timer

	state: State = {
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

	_refresh = async () => {
		let start = Date.now()
		this.setState(() => ({loading: true}))

		this.updateTime()

		let elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}

		this.setState(() => ({loading: false}))
	}

	refresh = () => {
		this._refresh()
	}

	render() {
		let {now, loading} = this.state

		if (this.props.invoke) {
			this.props.invoke()
		}

		if (this.props.moment) {
			let nowMoment: Moment = moment(now)

			if (this.props.timezone) {
				nowMoment = nowMoment.tz(this.props.timezone)
			}

			return this.props.render({now: nowMoment, loading, refresh: this.refresh})
		} else {
			return this.props.render({
				now,
				loading,
				refresh: this.refresh,
			})
		}
	}
}
