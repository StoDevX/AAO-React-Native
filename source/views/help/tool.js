// @flow

import * as React from 'react'
import {Alert, StyleSheet, Clipboard} from 'react-native'
import {Card} from '../components/card'
import {Button} from '../components/button'
import {Markdown} from '../components/markdown'
import actualOpenUrl from '../components/open-url'
import {email, phonecall} from 'react-native-communications'

export type ToolOptions = {|
  key: string,
  enabled?: boolean,
  hidden?: boolean,
  message?: string,
  versionRange?: string,
  title: string,
  body: string,
  buttons: Array<ButtonDef>,
|}

type EmailRecipient = string | Array<string>

type SendEmailButtonParams = {
  to: EmailRecipient,
  cc?: EmailRecipient,
  bcc?: EmailRecipient,
  subject: string,
  body: string,
}
type SendEmailButtonDef = {
  title: string,
  icon: string,
  enabled?: boolean,
  action: 'send-email',
  params: SendEmailButtonParams,
}

type OpenUrlButtonParams = {
  url: string,
}
type OpenUrlButtonDef = {
  title: string,
  icon: string,
  enabled?: boolean,
  action: 'open-url',
  params: OpenUrlButtonParams,
}

type CallPhoneButtonParams = {
  number: string,
}
type CallPhoneButtonDef = {
  title: string,
  icon: string,
  enabled?: boolean,
  action: 'call-phone',
  params: CallPhoneButtonParams,
}

export type ButtonDef =
  | SendEmailButtonDef
  | OpenUrlButtonDef
  | CallPhoneButtonDef

function callPhone(params: CallPhoneButtonParams) {
  try {
    phonecall(params.number, true)
  } catch (err) {
    Alert.alert(
      "Apologies, we couldn't call that number",
      `We were trying to call "${params.number}".`,
      [
        {
          text: 'Darn',
          onPress: () => {},
        },
        {
          text: 'Copy addresses',
          onPress: () => Clipboard.setString(params.number),
        },
      ],
    )
  }
}

function sendEmail(params: SendEmailButtonParams) {
  let {to, cc = [], bcc = [], subject, body} = params
  to = Array.isArray(to) ? to : [to]
  cc = Array.isArray(cc) ? cc : [cc]
  bcc = Array.isArray(bcc) ? bcc : [bcc]

  try {
    email(to, cc, bcc, subject, body)
  } catch (err) {
    const toString = to.join(', ')

    Alert.alert(
      "Apologies, we couldn't open an email client",
      `We were trying to email "${toString}".`,
      [
        {
          text: 'Darn',
          onPress: () => {},
        },
        {
          text: 'Copy addresses',
          onPress: () => Clipboard.setString(toString),
        },
      ],
    )
  }
}

function openUrl(params: OpenUrlButtonParams) {
  return actualOpenUrl(params.url)
}

function handleButtonPress(btn) {
  switch (btn.action) {
    case 'open-url':
      return openUrl(btn.params)
    case 'send-email':
      return sendEmail(btn.params)
    case 'call-phone':
      return callPhone(btn.params)
    default:
      ;(btn.action: empty)
  }
}

type Props = {
  config: ToolOptions,
}

export class ToolView extends React.Component<Props> {
  render() {
    const toolEnabled = this.props.config.enabled

    return (
      <Card
        footer={
          !toolEnabled
            ? this.props.config.message || 'This tool is disabled.'
            : false
        }
        header={this.props.config.title}
        style={styles.card}
      >
        <Markdown source={this.props.config.body} />

        {this.props.config.buttons.map(btn => {
          const {title, enabled = true} = btn
          return (
            <Button
              key={title}
              disabled={!toolEnabled || !enabled}
              onPress={() => handleButtonPress(btn)}
              title={title}
            />
          )
        })}
      </Card>
    )
  }
}

export const styles = StyleSheet.create({
  card: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    marginHorizontal: 0,
    marginBottom: 10,
  },
})
