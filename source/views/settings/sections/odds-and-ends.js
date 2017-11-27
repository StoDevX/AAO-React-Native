// @flow
import * as React from 'react'
import {View} from 'react-native'
import {Cell, Section} from 'react-native-tableview-simple'
import {version} from '../../../../package.json'
import type {TopLevelViewPropsType} from '../../types'
import {setFeedbackStatus} from '../../../flux/parts/settings'
import {connect} from 'react-redux'
import {CellToggle} from '../../components/cells/toggle'
import {PushButtonCell} from '../../components/cells/push-button'
import {trackedOpenUrl} from '../../components/open-url'

type Props = TopLevelViewPropsType & {
  onChangeFeedbackToggle: (feedbackDisabled: boolean) => any,
  feedbackDisabled: boolean,
}

class OddsAndEndsSection extends React.PureComponent<Props> {
  onPressButton = (id: string) => {
    this.props.navigation.navigate(id)
  }

  onCreditsButton = () => this.onPressButton('CreditsView')
  onPrivacyButton = () => this.onPressButton('PrivacyView')
  onLegalButton = () => this.onPressButton('LegalView')
  onSourceButton = () =>
    trackedOpenUrl({
      url: 'https://github.com/StoDevX/AAO-React-Native',
      id: 'ContributingView',
    })

  render() {
    return (
      <View>
        <Section header="MISCELLANY">
          <PushButtonCell onPress={this.onCreditsButton} title="Credits" />
          <PushButtonCell
            onPress={this.onPrivacyButton}
            title="Privacy Policy"
          />
          <PushButtonCell onPress={this.onLegalButton} title="Legal" />
          <PushButtonCell onPress={this.onSourceButton} title="Contributing" />
        </Section>

        <Section header="ODDS &amp; ENDS">
          <Cell cellStyle="RightDetail" detail={version} title="Version" />

          <CellToggle
            label="Share Analytics"
            // These are both inverted because the toggle makes more sense as
            // optout/optin, but the code works better as optin/optout.
            onChange={val => this.props.onChangeFeedbackToggle(!val)}
            value={!this.props.feedbackDisabled}
          />
        </Section>
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
