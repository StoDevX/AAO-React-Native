// @flow

import * as React from 'react'
import type {UnprocessedBusLine} from './types'
import {BusLine} from './line'
import {Timer} from '@frogpond/timer'
import {NoticeView, LoadingView} from '@frogpond/notice'
import type {TopLevelViewPropsType} from '../../types'
import {API} from '@frogpond/api'
import {fetch} from '@frogpond/fetch'
import {timezone} from '@frogpond/constants'

const fetchBusTimes = (): Promise<Array<UnprocessedBusLine>> =>
	fetch(API('/transit/bus'))
		.json()
		.then(body => body.data)

type Props = TopLevelViewPropsType & {
	+line: string,
}

type State = {|
	busLines: Array<UnprocessedBusLine>,
	activeBusLine: ?UnprocessedBusLine,
	loading: boolean,
|}

export class BusView extends React.PureComponent<Props, State> {
	state = {
		busLines: [],
		activeBusLine: null,
		loading: true,
	}

	componentDidMount() {
		this.fetchData().then(() => {
			this.setState(() => ({loading: false}))
		})
	}

	fetchData = async () => {
		let busLines = await fetchBusTimes()
		let activeBusLine = busLines.find(({line}) => line === this.props.line)

		this.setState(() => ({busLines, activeBusLine}))
	}

	openMap = () => {
		this.props.navigation.navigate('BusMapView', {
			line: this.state.activeBusLine,
		})
	}

	render() {
		if (this.state.loading) {
			return <LoadingView />
		}

		let {activeBusLine} = this.state

		if (!activeBusLine) {
			let lines = this.state.busLines.map(({line}) => line).join(', ')
			let msg = `The line "${this.props.line}" was not found among ${lines}`
			return <NoticeView text={msg} />
		}

		return (
			<Timer
				interval={60000}
				moment={true}
				render={({now}) => (
					<BusLine line={activeBusLine} now={now} openMap={this.openMap} />
				)}
				timezone={timezone()}
			/>
		)
	}
}
