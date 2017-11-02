// @flow
import React from 'react'
import {View} from 'react-native'
import {Cell, Section} from 'react-native-tableview-simple'
import {version} from '../../../../package.json'
import type {TopLevelViewPropsType} from '../../types'
import {setFeedbackStatus} from '../../../flux/parts/settings'
import {connect} from 'react-redux'
import {CellToggle} from '../../components/cells/toggle'
import {PushButtonCell} from '../../components/cells/push-button'
import {trackedOpenUrl} from '../../components/open-url'
import * as Icons from 'react-native-alternate-icons'

class OddsAndEndsSection extends React.Component {
  props: TopLevelViewPropsType & {
    onChangeFeedbackToggle: (feedbackDisabled: boolean) => any,
    feedbackDisabled: boolean,
  }

  state: {
    supported: false,
    loading: true,
  }

  componentWillMount() {
    this.checkIfSupported()
  }

  checkIfSupported() {
    Icons.supportDevice(result => this.setState(() => ({supported: result, loading: false})))
  }

  onPressButton = (id: string) => {
    this.props.navigation.navigate(id)
  }

  onCreditsButton = () => this.onPressButton('CreditsView')
  onPrivacyButton = () => this.onPressButton('PrivacyView')
  onLegalButton = () => this.onPressButton('LegalView')
  onSnapshotsButton = () => this.onPressButton('SnapshotsView')
  onSourceButton = () =>
    trackedOpenUrl({
      url: 'https://github.com/StoDevX/AAO-React-Native',
      id: 'ContributingView',
    })
  onAppIconButton = () => this.onPressButton('IconSettingsView')

  render() {
    if (this.state.loading) {
      return <View />
    }

    return (
      <View>
        <Section header="MISCELLANY">
          {this.state.supported ? (
            <Cell
              cellStyle="RightDetail"
              title="Change App Icon"
              accessory="DisclosureIndicator"
              onPress={this.onAppIconButton}
            />
          ) : null}
          <PushButtonCell title="Credits" onPress={this.onCreditsButton} />
          <PushButtonCell
            title="Privacy Policy"
            onPress={this.onPrivacyButton}
          />
          <PushButtonCell title="Legal" onPress={this.onLegalButton} />
          <PushButtonCell title="Contributing" onPress={this.onSourceButton} />
        </Section>

        <Section header="ODDS &amp; ENDS">
          <Cell cellStyle="RightDetail" title="Version" detail={version} />

          <CellToggle
            label="Share Analytics"
            // These are both inverted because the toggle makes more sense as
            // optout/optin, but the code works better as optin/optout.
            value={!this.props.feedbackDisabled}
            onChange={val => this.props.onChangeFeedbackToggle(!val)}
          />
        </Section>

        {process.env.NODE_ENV === 'development' ? (
          <Section header="UTILITIES">
            <PushButtonCell
              title="Snapshots"
              onPress={this.onSnapshotsButton}
            />
          </Section>
        ) : null}
      </View>
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
