import * as React from 'react'
import {default as moment, type Moment} from 'moment-timezone'
import delay from 'delay'

export function msUntilIntervalRepeat(now: number, interval: number): number {
	return interval - (now % interval)
}

type RenderState<T> = {
	now: T
	loading: boolean
	refresh: () => void
}

type MomentRender = {
	moment: true
	render: (state: RenderState<Moment>) => JSX.Element
}
type DateRender = {
	moment: false
	render: (state: RenderState<Date>) => JSX.Element
}

type Props = {
	interval: number // ms
	timezone?: string
	invoke?: () => void
} & (MomentRender | DateRender)

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

	componentDidMount(): void {
		// get the time remaining until the next $interval
		let {interval} = this.props
		let nowMs = this.state.now.getTime()
		let untilNextInterval = msUntilIntervalRepeat(nowMs, interval)

		this._timeoutId = setTimeout(() => {
			this.updateTime()
			this._intervalId = setInterval(this.updateTime, interval)
		}, untilNextInterval)
	}

	componentWillUnmount(): void {
		this._timeoutId != null && clearTimeout(this._timeoutId)
		this._intervalId != null && clearInterval(this._intervalId)
	}

	updateTime = (): void => {
		this.setState(() => ({now: new Date()}))
	}

	_refresh = async (): Promise<void> => {
		let start = Date.now()
		this.setState(() => ({loading: true}))

		this.updateTime()

		let elapsed = Date.now() - start
		if (elapsed < 500) {
			await delay(500 - elapsed)
		}

		this.setState(() => ({loading: false}))
	}

	refresh = (): void => {
		this._refresh()
	}

	render(): JSX.Element {
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
