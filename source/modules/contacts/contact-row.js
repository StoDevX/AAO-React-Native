// @flow

import React from 'react'
import type {ContactType} from './types'
import {formatNumber} from './contact-helper'
import {ListRow, Detail, Title} from '../../components/list'
import {Column, Row} from '../../components/layout'

export class ContactRow extends React.PureComponent {
  props: {
    onPress: ContactType => any,
    contact: ContactType,
  }

  _onPress = () => this.props.onPress(this.props.contact)

  render() {
    const {contact} = this.props

    return (
      <ListRow onPress={this._onPress} arrowPosition="top">
        <Row alignItems="center">
          <Column flex={1}>
            <Title lines={1}>{contact.title}</Title>
            <Detail lines={1}>{formatNumber(contact.phoneNumber)}</Detail>
          </Column>
        </Row>
      </ListRow>
    )
  }
}
