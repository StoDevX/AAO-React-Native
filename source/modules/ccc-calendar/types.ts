export type NamedCalendar = string
export interface GoogleCalendar {type: 'google'; id: string}
export interface ReasonCalendar {type: 'reason'; url: string}
export interface IcsCalendar {type: 'ics'; url: string}

export type Calendar =
	| NamedCalendar
	| GoogleCalendar
	| ReasonCalendar
	| IcsCalendar
