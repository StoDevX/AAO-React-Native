// @flow

const SECONDS_MULT = 1
const MINUTES_MULT = SECONDS_MULT * 60
const HOURS_MULT = MINUTES_MULT * 60
const DAYS_MULT = HOURS_MULT * 24
const WEEKS_MULT = DAYS_MULT * 7
const MONTHS_MULT = WEEKS_MULT * 4
const YEARS_MULT = MONTHS_MULT * 12

export function seconds(n: number) {
	return n
}

export function minutes(n: number) {
	return n * MINUTES_MULT
}

export function hours(n: number) {
	return n * HOURS_MULT
}

export function days(n: number) {
	return n * DAYS_MULT
}

export function weeks(n: number) {
	return n * WEEKS_MULT
}

export function months(n: number) {
	return n * MONTHS_MULT
}

export function years(n: number) {
	return n * YEARS_MULT
}

export let age = {
	second: seconds,
	seconds,
	minute: minutes,
	minutes,
	hour: hours,
	hours,
	day: days,
	days,
	week: weeks,
	weeks,
	month: months,
	months,
	year: years,
	years,
}
