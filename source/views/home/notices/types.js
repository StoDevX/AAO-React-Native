// @flow

export type HomescreenNotice = {
	severity: 'alert' | 'info' | 'notice',
	message: string,
	snippet?: string,
	title?: string,
	icon?: string,
	backgroundColor?: string,
	foregroundColor?: string,
	dismissable?: boolean,
	repeatIfDismissed?: {
		repeat: boolean,
		interval: string,
	},
}
