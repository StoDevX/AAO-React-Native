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

  render() {
    return (
      <Section header='ODDS &amp; ENDS'>
        <Cell cellStyle='RightDetail' title='Version' detail={version} />

        <CellToggle
          label='Share Analytics'
          // These are both inverted because the toggle makes more sense as
          // optout/optin, but the code works better as optin/optout.
          value={!this.props.feedbackDisabled}
          onChange={val => this.props.onChangeFeedbackToggle(!val)}
        />

        <PushButtonCell
          title='FAQ'
          onPress={() => this.onPressButton('FaqView', 'FAQs')}
        />

        <PushButtonCell
          title='Credits'
          onPress={() => this.onPressButton('CreditsView', 'Credits')}
        />

        <PushButtonCell
          title='Privacy Policy'
          onPress={() => this.onPressButton('PrivacyView', 'Privacy Policy')}
        />

        <PushButtonCell
          title='Legal'
          onPress={() => this.onPressButton('LegalView', 'Legal')}
        />
      </Section>
    )
  }
}

const PushButtonCell = (
  {title, onPress}: {title: string, onPress: () => any},
) => {
  return (
    <Cell
      cellStyle='Basic'
      title={title}
      accessory='DisclosureIndicator'
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
