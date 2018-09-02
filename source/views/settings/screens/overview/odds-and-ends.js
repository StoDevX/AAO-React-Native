// @flow
import * as React from 'react'
import {Cell, Section, CellToggle} from '@frogpond/tableview'
import {APP_VERSION} from '../../../../lib/constants'
import {setFeedbackStatus} from '../../../../redux/parts/settings'
import {connect} from 'react-redux'
import {sectionBgColor} from '@frogpond/colors'

type Props = {
	onChangeFeedbackToggle: (feedbackDisabled: boolean) => any,
	feedbackDisabled: boolean,
}

export class OddsAndEndsSection extends React.Component<Props> {
	render() {
		let [version, build] = APP_VERSION.split('+')

		return (
			<Section header="ODDS &amp; ENDS" sectionTintColor={sectionBgColor}>
				<Cell cellStyle="RightDetail" detail={version} title="Version" />
				{build && (
					<Cell cellStyle="RightDetail" detail={build} title="Build Number" />
				)}

				<CellToggle
					label="Share Analytics"
					// These are both inverted because the toggle makes more sense as
					// optout/optin, but the code works better as optin/optout.
					onChange={val => this.props.onChangeFeedbackToggle(!val)}
					value={!this.props.feedbackDisabled}
				/>
			</Section>
		)
	}
}

function mapStateToProps(state) {
	return {
		feedbackDisabled: state.settings.feedbackDisabled,
	}
}

function mapDispatchToProps(dispatch) {
	return {
		onChangeFeedbackToggle: s => dispatch(setFeedbackStatus(s)),
	}
}

export default connect(
	mapStateToProps,
	mapDispatchToProps,
)(OddsAndEndsSection)
