// @flow
import * as React from 'react'
import {Cell, Section, CellToggle} from '@frogpond/tableview'
import {appVersion, appBuild} from '@frogpond/constants'
import {setFeedbackStatus} from '../../../../redux/parts/settings'
import type {ReduxState} from '../../../../redux'
import {connect} from 'react-redux'

type Props = {}

export class OddsAndEndsSection extends React.Component<Props> {
	render() {
		let version = appVersion()
		let build = appBuild()

		return (
			<Section header="ODDS &amp; ENDS">
				<Cell cellStyle="RightDetail" detail={version} title="Version" />
				{build && (
					<Cell cellStyle="RightDetail" detail={build} title="Build Number" />
				)}

				<ConnectedAnalyticsCell />
			</Section>
		)
	}
}

type AnalyticsCellProps = {
	feedbackDisabled: boolean,
	onChangeFeedbackToggle: boolean => any,
}

function AnalyticsCell(props: AnalyticsCellProps) {
	let {feedbackDisabled, onChangeFeedbackToggle} = props
	return (
		<CellToggle
			label="Share Analytics"
			// These are both inverted because the toggle makes more sense as
			// optout/optin, but the code works better as optin/optout.
			onChange={val => onChangeFeedbackToggle(!val)}
			value={!feedbackDisabled}
		/>
	)
}

const ConnectedAnalyticsCell = connect(
	(state: ReduxState) => ({
		feedbackDisabled: state.settings ? state.settings.feedbackDisabled : false,
	}),
	dispatch => ({
		onChangeFeedbackToggle: (s: boolean) => dispatch(setFeedbackStatus(s)),
	}),
)(AnalyticsCell)
