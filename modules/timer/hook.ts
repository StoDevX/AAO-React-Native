import React, {useCallback, useEffect, useRef, useState} from 'react'

import {default as moment, unitOfTime, type Moment} from 'moment-timezone'
import {msUntilIntervalRepeat} from './index'
import {memoize} from 'lodash'
import {timezone} from '@frogpond/constants'

type BasicProps = {
	intervalMs: number // ms
	timezone?: string
}

type MomentProps = BasicProps & {
	timezone?: string
	startOf?: unitOfTime.StartOf
}

export function useDateTimer(props: BasicProps): {now: Date} {
	let {intervalMs} = props

	let [now, setNow] = useState(() => new Date())
	let timeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null)
	let intervalRef = useRef<null | ReturnType<typeof setInterval>>(null)

	let updateTime = useCallback(() => {
		setNow(new Date())
	}, [])

	useEffect(() => {
		// get the time remaining until the next $interval
		let nowMs = now.getTime()
		let untilNextInterval = msUntilIntervalRepeat(nowMs, intervalMs)

		timeoutRef.current = setTimeout(() => {
			updateTime()
			intervalRef.current = setInterval(updateTime, intervalMs)
		}, untilNextInterval)

		return () => {
			intervalRef.current !== null && clearInterval(intervalRef.current)
			timeoutRef.current !== null && clearTimeout(timeoutRef.current)
		}
	})

	return {now}
}

export function useMomentTimer(props: MomentProps): {now: Moment} {
	let {intervalMs, timezone, startOf} = props

	let [now, setNow] = useState(() => moment())
	let timeoutRef = useRef<null | ReturnType<typeof setTimeout>>(null)
	let intervalRef = useRef<null | ReturnType<typeof setInterval>>(null)

	let updateTime = useCallback(() => {
		let newNow = moment()
		if (timezone) {
			newNow = newNow.tz(timezone)
		}
		if (startOf) {
			newNow = newNow.startOf(startOf)
		}
		// if (newNow.isSame(now)) {
		// 	return;
		// }
		setNow(newNow)
	}, [timezone, startOf])

	useEffect(() => {
		// get the time remaining until the next $interval
		let nowMs = now.milliseconds()
		let untilNextInterval = msUntilIntervalRepeat(nowMs, intervalMs)

		timeoutRef.current = setTimeout(() => {
			updateTime()
			intervalRef.current = setInterval(updateTime, intervalMs)
		}, untilNextInterval)
	})

	return {now}
}
