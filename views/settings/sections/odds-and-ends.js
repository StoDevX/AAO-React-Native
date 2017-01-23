// @flow
import React from 'react'
import {Cell, Section} from 'react-native-tableview-simple'
import {getVersion} from 'react-native-device-info'
import type {TopLevelViewPropsType} from '../../types'

export
class OddsAndEndsSection extends React.Component {
  props: TopLevelViewPropsType;

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
          detail={getVersion()}
        />

        <Cell cellStyle='Basic'
          title='FAQ'
          accessory='DisclosureIndicator'
          onPress={() => this.onPressFaqButton()}
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
