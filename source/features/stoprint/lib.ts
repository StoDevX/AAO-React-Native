const TIME_FORMAT = 'h:mm:ss A'
import {timezone} from '@frogpond/constants'
import moment from 'moment-timezone'
import type {Moment} from 'moment-timezone'

const parseTime = (now: Moment, time: string): null | Moment => {
	// interpret in Central time
	let m = moment.tz(time, TIME_FORMAT, true, timezone())

	// and set the date to today
	m.dayOfYear(now.dayOfYear())

	// if release time is before current time (regardless of day)
	if (m.diff(now) < 0) {
		// then it expires tomorrow
		m.add(1, 'days')
	}

	return m
}

export const getTimeRemaining = (now: Moment, time: string): undefined | string => {
	return parseTime(now, time)?.fromNow()
}

/** Which of the print-jobs screen's three states the reader should see. */
export type PrintJobsGate = 'loading' | 'signed-out' | 'jobs'

/**
 * Decides between waiting on the keychain, asking the reader to sign in, and
 * showing their jobs.
 *
 * Kept apart from the screen so the decision can be tested directly: it turns
 * on a mocking flag that only a UI-test launch sets, which is exactly the
 * combination a rendered test would struggle to reach.
 */
export function printJobsGate(state: {
	isLoadingCredentials: boolean
	hasCredentials: boolean
	isMocked: boolean
}): PrintJobsGate {
	let {isLoadingCredentials, hasCredentials, isMocked} = state

	if (isLoadingCredentials) {
		return 'loading'
	}

	return hasCredentials || isMocked ? 'jobs' : 'signed-out'
}

/**
 * The account a mocked run prints as. Matches `mockLogin.realName`, so the
 * fixtures agree with each other.
 */
export const MOCK_STOPRINT_USERNAME = 'olethelion'

/**
 * The account stoPrint's queries should ask about.
 *
 * Every one of them is `enabled: Boolean(username)`, so a mocked run with no
 * signed-in account would leave them disabled and the screen on its spinner
 * forever -- mocking the API is not on its own enough to reach a job list.
 */
export function stoprintUsername(
	credentials: {username: string} | null | undefined,
	isMocked: boolean,
): string {
	if (credentials?.username) {
		return credentials.username
	}
	return isMocked ? MOCK_STOPRINT_USERNAME : ''
}
