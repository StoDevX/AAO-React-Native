// @flow

type EmailRecipient = string | Array<string>

export type SendEmailButtonParams = {
	to: EmailRecipient,
	cc?: EmailRecipient,
	bcc?: EmailRecipient,
	subject: string,
	body: string,
}
type SendEmailButtonDef = {
	title: string,
	icon: string,
	enabled?: boolean,
	action: 'send-email',
	params: SendEmailButtonParams,
}

export type OpenUrlButtonParams = {
	url: string,
}
type OpenUrlButtonDef = {
	title: string,
	icon: string,
	enabled?: boolean,
	action: 'open-url',
	params: OpenUrlButtonParams,
}

export type CallPhoneButtonParams = {
	number: string,
}
type CallPhoneButtonDef = {
	title: string,
	icon: string,
	enabled?: boolean,
	action: 'call-phone',
	params: CallPhoneButtonParams,
}

export type ButtonDef =
	| SendEmailButtonDef
	| OpenUrlButtonDef
	| CallPhoneButtonDef

export type ToolOptions = {|
	key: string,
	enabled?: boolean,
	hidden?: boolean,
	message?: string,
	versionRange?: string,
	title: string,
	body: string,
	buttons: Array<ButtonDef>,
|}
