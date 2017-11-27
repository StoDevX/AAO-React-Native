// @flow
import * as React from 'react'
import {Alert, StyleSheet, ScrollView, Image} from 'react-native'
import {contactImages} from '../../../images/contact-images'
import {Markdown} from '../components/markdown'
import {ListFooter} from '../components/list'
import glamorous from 'glamorous-native'
import {phonecall} from 'react-native-communications'
import {tracker} from '../../analytics'
import {Button} from '../components/button'
import openUrl from '../components/open-url'
import type {ContactType} from './types'

const AAO_URL = 'https://github.com/StoDevX/AAO-React-Native/issues/new'

const Title = glamorous.text({
  fontSize: 36,
  textAlign: 'center',
  marginHorizontal: 18,
  marginVertical: 10,
})

const Container = glamorous.view({
  paddingHorizontal: 18,
  paddingVertical: 6,
})

const styles = StyleSheet.create({
  paragraph: {
    fontSize: 16,
  },
  image: {
    width: null,
    height: 100,
  },
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

type Props = {navigation: {state: {params: {contact: ContactType}}}}

export class ContactsDetailView extends React.PureComponent<Props> {
  static navigationOptions = ({navigation}) => {
    return {
      title: navigation.state.params.contact.title,
    }
  }

  onPress = () => {
    const {
      title,
      phoneNumber,
      buttonText,
      buttonLink,
    } = this.props.navigation.state.params.contact
    tracker.trackScreenView(`ImportantContacts_${title.replace(' ', '')}View`)
    if (buttonLink) {
      openUrl(buttonLink)
    } else if (phoneNumber) {
      promptCall(buttonText, phoneNumber)
    }
  }

  render() {
    const contact = this.props.navigation.state.params.contact
    const headerImage =
      contact.image && contactImages.hasOwnProperty(contact.image)
        ? contactImages[contact.image]
        : null
    return (
      <ScrollView>
        {headerImage ? (
          <Image resizeMode="cover" source={headerImage} style={styles.image} />
        ) : null}
        <Container>
          <Title selectable={true}>{contact.title}</Title>

          <Markdown
            source={contact.text}
            styles={{Paragraph: styles.paragraph}}
          />

          <Button onPress={this.onPress} title={contact.buttonText} />

          <ListFooter
            href={AAO_URL}
            title="Collected by the humans of All About Olaf"
          />
        </Container>
      </ScrollView>
    )
  }
}
