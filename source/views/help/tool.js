// @flow

import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Card} from '../components/card'
import {Button} from '../components/button'
import {Markdown} from '../components/markdown'
import {openUrl} from '../components/open-url'
import {sendEmail} from '../components/send-email'
import {callPhone} from '../components/call-phone'
import type {
	ToolOptions,
	CallPhoneButtonParams,
	SendEmailButtonParams,
	OpenUrlButtonParams,
} from './types'

function handleCallPhone(params: CallPhoneButtonParams) {
	callPhone(params.number)
}

function handleSendEmail(params: SendEmailButtonParams) {
	let {to, cc = [], bcc = [], subject, body} = params
	to = Array.isArray(to) ? to : [to]
	cc = Array.isArray(cc) ? cc : [cc]
	bcc = Array.isArray(bcc) ? bcc : [bcc]
	sendEmail({to, cc, bcc, subject, body})
}

function handleOpenUrl(params: OpenUrlButtonParams) {
	return openUrl(params.url)
}

function handleButtonPress(btn) {
	switch (btn.action) {
		case 'open-url':
			return handleOpenUrl(btn.params)
		case 'send-email':
			return handleSendEmail(btn.params)
		case 'call-phone':
			return handleCallPhone(btn.params)
		default:
			;(btn.action: empty)
	}
}

type Props = {
	config: ToolOptions,
}

export class ToolView extends React.Component<Props> {
	render() {
		const toolEnabled = this.props.config.enabled

		return (
			<Card
				footer={
					!toolEnabled
						? this.props.config.message || 'This tool is disabled.'
						: false
				}
				header={this.props.config.title}
				style={styles.card}
			>
				<Markdown source={this.props.config.body} />

				{this.props.config.buttons.map(btn => {
					const {title, enabled = true} = btn
					return (
						<Button
							key={title}
							disabled={!toolEnabled || !enabled}
							onPress={() => handleButtonPress(btn)}
							title={title}
						/>
					)
				})}
			</Card>
		)
	}
}

export const styles = StyleSheet.create({
	card: {
		paddingHorizontal: 20,
		paddingVertical: 15,
		marginHorizontal: 0,
		marginBottom: 10,
	},
})
