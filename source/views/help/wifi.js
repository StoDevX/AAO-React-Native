// @flow

import * as React from 'react'
import {Card} from '../components/card'
import {Button} from '../components/button'
import {Markdown} from '../components/markdown'
import retry from 'p-retry'
import delay from 'delay'
import {reportNetworkProblem} from '../../lib/report-network-problem'
import {Error, ErrorMessage} from './components'
import {getPosition, collectData, reportToServer} from './wifi-tools'
import {styles} from './tool'
import type {ToolOptions} from './types'

export const toolName = 'wifi'

const messages = {
	init: 'Report',
	collecting: 'Collecting data…',
	reporting: 'Reporting data…',
	done: 'Thanks!',
	error: 'Try again?',
}

type Props = {
	config: ToolOptions,
}

type State = {
	error: ?string,
	status: $Keys<typeof messages>,
}

export class ToolView extends React.Component<Props, State> {
	state = {
		error: null,
		status: 'init',
	}

	start = async () => {
		let reportUrl =
			'https://www.stolaf.edu/apps/all-about-olaf/wifi/index.cfm?fuseaction=Submit'
 

		if (this.props.config.buttons && this.props.config.buttons.length >= 1) {
			const btnConfig = this.props.config.buttons[0]
			if (btnConfig.action === 'custom') {
				reportUrl = btnConfig.params.url
			}
		}

		this.setState(() => ({status: 'collecting', error: ''}))
		const [position, device] = await Promise.all([getPosition(), collectData()])
		this.setState(() => ({status: 'reporting'}))

		try {
			let data = {position, device, version: 1}
			await retry(() => reportToServer(reportUrl, data), {retries: 10})
			await delay(1000)
			this.setState(() => ({status: 'done'}))
		} catch (err) {
			reportNetworkProblem(err)
			this.setState(() => ({
				error:
					this.props.config.errorMessage ||
					'Apologies; there was an error. Please try again later.',
				status: 'error',
			}))
		}
	}

	render() {
		const toolEnabled = this.props.config.enabled
		let buttonMessage = messages[this.state.status] || 'Error'
		let buttonEnabled =
			this.state.status === 'init' || this.state.status === 'error'

		if (this.props.config.buttons && this.props.config.buttons.length >= 1) {
			const btnConfig = this.props.config.buttons[0]
			buttonEnabled = buttonEnabled && btnConfig.enabled !== false
			buttonMessage =
				this.state.status === 'init' ? btnConfig.title : buttonMessage
		}

		if (!toolEnabled) {
			buttonEnabled = false
		}

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

				{this.state.error ? (
					<Error>
						<ErrorMessage selectable={true}>{this.state.error}</ErrorMessage>
					</Error>
				) : null}

				<Button
					disabled={!buttonEnabled}
					onPress={this.start}
					title={buttonMessage}
				/>
			</Card>
		)
	}
}
