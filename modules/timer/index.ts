import {useState} from 'react'
import {default as moment, unitOfTime, type Moment} from 'moment-timezone'
import {useInterval} from './use-interval'

interface BasicProps {
	intervalMs: number // ms
}

interface MomentProps extends BasicProps {
	timezone?: string
	startOf?: unitOfTime.StartOf
}

export function useDateTimer(props: BasicProps): {now: Date} {
	let {intervalMs} = props
	let [now, setNow] = useState(() => new Date())

	useInterval(() => {
		setNow(new Date())
	}, intervalMs)

	return {now}
}

export function useMomentTimer(props: MomentProps): {now: Moment} {
	let {intervalMs, timezone, startOf} = props
	let [now, setNow] = useState(() => moment())

	useInterval(() => {
		let newNow = moment()
		if (timezone) {
			newNow = newNow.tz(timezone)
		}
		if (startOf) {
			newNow = newNow.startOf(startOf)
		}
		if (now.isSame(newNow)) {
			return
		}
		setNow(newNow)
	}, intervalMs)

	return {now}
}
