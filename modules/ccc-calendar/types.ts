export type NamedCalendar = string
export type GoogleCalendar = {type: 'google'; id: string}
export type ReasonCalendar = {type: 'reason'; url: string}
export type IcsCalendar = {type: 'ics'; url: string}

export type Calendar =
	| NamedCalendar
	| GoogleCalendar
	| ReasonCalendar
	| IcsCalendar
