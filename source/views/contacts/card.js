// @flow

import React from 'react'
import {Alert} from 'react-native'
import {Button} from '../components/button'
import {phonecall} from 'react-native-communications'
import {tracker} from '../../analytics'
import type {CardType} from './types'
import {Markdown} from '../components/markdown'
import glamorous from 'glamorous-native'
import * as c from '../components/colors'

const Title = glamorous.text({
  fontSize: 30,
  alignSelf: 'center',
  marginTop: 10,
})

const Container = glamorous.view({
  backgroundColor: c.white,
  paddingHorizontal: 10,
})

function formatNumber(phoneNumber: string) {
  const re = /(\d{3})-?(\d{3})-?(\d{4})/g
  return phoneNumber.replace(re, '($1) $2-$3')
}

function promptCall(buttonText: string, phoneNumber: string) {
  Alert.alert(buttonText, formatNumber(phoneNumber), [
    {text: 'Cancel', onPress: () => console.log('Call cancel pressed')},
    {text: 'Call', onPress: () => phonecall(phoneNumber, false)},
  ])
}

export class ContactCard extends React.PureComponent {
  props: CardType

  onPress = () => {
    const {title, phoneNumber, buttonText} = this.props
    tracker.trackScreenView(`ImportantContacts_${title.replace(' ', '')}View`)
    promptCall(buttonText, phoneNumber)
  }

  render() {
    const {title, text, buttonText} = this.props

    return (
      <Container>
        <Title selectable={true}>{title}</Title>
        <Markdown source={text} />
        <Button onPress={this.onPress} title={buttonText} />
      </Container>
    )
  }
}
