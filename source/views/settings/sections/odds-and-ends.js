// @flow
import React from 'react'
import {Text, Switch} from 'react-native'
import {Cell, CustomCell, Section} from 'react-native-tableview-simple'
import {version} from '../../../../package.json'
import type {TopLevelViewPropsType} from '../../types'
import {setFeedbackStatus} from '../../../flux/parts/settings'
import {connect} from 'react-redux'

class OddsAndEndsSection extends React.Component {
  props: TopLevelViewPropsType & {
    onChangeFeedbackToggle: (feedbackDisabled: boolean) => any,
    feedbackDisabled: boolean,
  };

  onPressLegalButton = () => {
    this.props.navigator.push({
      id: 'LegalView',
      title: 'Legal',
      index: this.props.route.index + 1,
    })
  };

  onPressCreditsButton = () => {
    this.props.navigator.push({
      id: 'CreditsView',
      title: 'Credits',
      index: this.props.route.index + 1,
    })
  };

  onPressPrivacyButton = () => {
    this.props.navigator.push({
      id: 'PrivacyView',
      title: 'Privacy Policy',
      index: this.props.route.index + 1,
    })
  };

  onPressFaqButton = () => {
    this.props.navigator.push({
      id: 'FaqView',
      title: 'FAQs',
      index: this.props.route.index + 1,
    })
  };

  render () {
    return (
      <Section header='ODDS & ENDS'>
        <Cell cellStyle='RightDetail'
          title='Version'
          detail={version}
        />

        <CustomCell>
          <Text style={{flex: 1, fontSize: 16}}>Share Analytics</Text>
          {/*These are both inverted because the toggle makes more sense as optout/optin, but the code works better as optin/optout */}
          <Switch value={!this.props.feedbackDisabled} onValueChange={val => this.props.onChangeFeedbackToggle(!val)} />
        </CustomCell>

        <Cell cellStyle='Basic'
          title='FAQ'
          accessory='DisclosureIndicator'
          onPress={this.onPressFaqButton}
        />

        <Cell cellStyle='Basic'
          title='Credits'
          accessory='DisclosureIndicator'
          onPress={this.onPressCreditsButton}
        />

        <Cell cellStyle='Basic'
          title='Privacy Policy'
          accessory='DisclosureIndicator'
          onPress={this.onPressPrivacyButton}
        />

        <Cell cellStyle='Basic'
          title='Legal'
          accessory='DisclosureIndicator'
          onPress={this.onPressLegalButton}
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

export default connect(mapStateToProps, mapDispatchToProps)(OddsAndEndsSection)
