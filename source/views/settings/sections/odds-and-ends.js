// @flow
import * as React from 'react'
import {Cell, Section} from 'react-native-tableview-simple'
import {version} from '../../../../package.json'
import type {TopLevelViewPropsType} from '../../types'
import {setFeedbackStatus} from '../../../redux/parts/settings'
import {connect} from 'react-redux'
import {CellToggle} from '../../../components/cells/toggle'
import {sectionBgColor} from '../../../components/colors'

type Props = TopLevelViewPropsType & {
	onChangeFeedbackToggle: (feedbackDisabled: boolean) => any,
	feedbackDisabled: boolean,
}

class OddsAndEndsSection extends React.PureComponent<Props> {
	render() {
		return (
			<React.Fragment>
				<Section header="ODDS &amp; ENDS" sectionTintColor={sectionBgColor}>
					<Cell cellStyle="RightDetail" detail={version} title="Version" />

					<CellToggle
						label="Share Analytics"
						// These are both inverted because the toggle makes more sense as
						// optout/optin, but the code works better as optin/optout.
						onChange={val => this.props.onChangeFeedbackToggle(!val)}
						value={!this.props.feedbackDisabled}
					/>
				</Section>
			</React.Fragment>
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
