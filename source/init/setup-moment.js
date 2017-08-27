// @flow
import moment from 'moment-timezone'

// These next values made possible by
// http://stackoverflow.com/questions/42513276

// Tell Moment to round up, so that Moment will always report the
// time until something else in a way that matches the clock time.
// That is, at 5:22pm, Moment will report "8 minutes until 5:30pm"
// until the clock ticks over to 5:23pm.
// If we do Math.floor, we go the other direction: it will report
// "7 minutes until 5:30pm" as soon as 5:22pm starts.
moment.relativeTimeRounding(Math.ceil)

// Tell Moment that a minute is 60 seconds, for reporting purposes.
// It defaults to 45 seconds.
moment.relativeTimeThreshold('s', 60)
