// @flow
import React from 'react'
import {Cell, Section} from 'react-native-tableview-simple'
import {version} from '../../../../package.json'
import type {TopLevelViewPropsType} from '../../types'
import {setFeedbackStatus} from '../../../flux/parts/settings'
import {connect} from 'react-redux'
import {CellToggle} from '../../components/cell-toggle'
import {PushButtonCell} from '../components/push-button'
import {trackedOpenUrl} from '../../components/open-url'

class OddsAndEndsSection extends React.Component {
  props: TopLevelViewPropsType & {
    onChangeFeedbackToggle: (feedbackDisabled: boolean) => any,
    feedbackDisabled: boolean,
  }

  onPressButton = (id: string, title: string) => {
    this.props.navigator.push({
      id: id,
      title: title,
      index: this.props.route.index + 1,
    })
  }

  onCreditsButton = () => this.onPressButton('CreditsView', 'Credits')
  onPrivacyButton = () => this.onPressButton('PrivacyView', 'Privacy Policy')
  onLegalButton = () => this.onPressButton('LegalView', 'Legal')
  onSnapshotsButton = () => this.onPressButton('SnapshotsView', 'Snapshot Time')
  onSourceButton = () =>
    trackedOpenUrl({
      url: 'https://github.com/StoDevX/AAO-React-Native',
      id: 'ContributingView',
    })

  render() {
    return (
      <Section header="ODDS &amp; ENDS">
        <Cell cellStyle="RightDetail" title="Version" detail={version} />

        <CellToggle
          label="Share Analytics"
          // These are both inverted because the toggle makes more sense as
          // optout/optin, but the code works better as optin/optout.
          value={!this.props.feedbackDisabled}
          onChange={val => this.props.onChangeFeedbackToggle(!val)}
        />

        <PushButtonCell title="Credits" onPress={this.onCreditsButton} />
        <PushButtonCell title="Privacy Policy" onPress={this.onPrivacyButton} />
        <PushButtonCell title="Legal" onPress={this.onLegalButton} />
        <PushButtonCell title="Contributing" onPress={this.onSourceButton} />

        {process.env.NODE_ENV === 'development'
          ? <PushButtonCell
              title="Snapshots"
              onPress={this.onSnapshotsButton}
            />
          : null}
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

export default connect(mapStateToProps, mapDispatchToProps)(OddsAndEndsSection)
