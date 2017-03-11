// @flow
import React from 'react'
import {Cell, Section} from 'react-native-tableview-simple'
import {version} from '../../../../package.json'
import type {TopLevelViewPropsType} from '../../types'
import {setFeedbackStatus} from '../../../flux/parts/settings'
import {connect} from 'react-redux'
import {CellToggle} from '../../components/cell-toggle'

class OddsAndEndsSection extends React.Component {
  props: TopLevelViewPropsType & {
    onChangeFeedbackToggle: (feedbackDisabled: boolean) => any,
    feedbackDisabled: boolean,
  };

  onPressButton = (id: string, title: string) => {
    this.props.navigator.push({
      id: id,
      title: title,
      index: this.props.route.index + 1,
    })
  };

  onFaqButton = () => this.onPressButton('FaqView', 'FAQs');
  onCreditsButton = () => this.onPressButton('CreditsView', 'Credits');
  onPrivacyButton = () => this.onPressButton('PrivacyView', 'Privacy Policy');
  onLegalButton = () => this.onPressButton('LegalView', 'Legal');
  onSnapshotsButton = () =>
    this.onPressButton('SnapshotsView', 'Snapshot Time');

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

        <PushButtonCell title="FAQ" onPress={this.onFaqButton} />
        <PushButtonCell title="Credits" onPress={this.onCreditsButton} />
        <PushButtonCell title="Privacy Policy" onPress={this.onPrivacyButton} />
        <PushButtonCell title="Legal" onPress={this.onLegalButton} />

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

const PushButtonCell = (
  {title, onPress}: {title: string, onPress: () => any},
) => {
  return (
    <Cell
      cellStyle="Basic"
      title={title}
      accessory="DisclosureIndicator"
      onPress={onPress}
    />
  )
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
