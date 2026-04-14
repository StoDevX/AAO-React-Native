import {useState} from 'react'
import {Temporal} from 'temporal-polyfill'
import {now as temporalNow} from '../../source/lib/temporal'
import {useInterval} from './use-interval'

interface BasicProps {
	intervalMs: number // ms
}

interface TemporalProps extends BasicProps {
	timezone?: string
	startOf?: 'minute'
}

export function useDateTimer(props: BasicProps): {now: Date} {
	let {intervalMs} = props
	let [nowDate, setNow] = useState(() => new Date())

	useInterval(() => {
		setNow(new Date())
	}, intervalMs)

	return {now: nowDate}
}

export function useTemporalTimer(props: TemporalProps): {
	now: Temporal.ZonedDateTime
} {
	let {intervalMs, timezone, startOf} = props
	let [nowDt, setNow] = useState<Temporal.ZonedDateTime>(() =>
		computeNow(timezone, startOf),
	)

	useInterval(() => {
		let next = computeNow(timezone, startOf)
		if (Temporal.ZonedDateTime.compare(nowDt, next) !== 0) {
			setNow(next)
		}
	}, intervalMs)

	return {now: nowDt}
}

function computeNow(
	timezone?: string,
	startOf?: 'minute',
): Temporal.ZonedDateTime {
	let dt = temporalNow(timezone)
	if (startOf === 'minute') {
		dt = dt.with({second: 0, millisecond: 0, microsecond: 0, nanosecond: 0})
	}
	return dt
}

/** @deprecated Use useTemporalTimer instead */
export const useMomentTimer = useTemporalTimer as unknown as (props: {
	intervalMs: number
	timezone?: string
	startOf?: string
}) => {now: Temporal.ZonedDateTime}
