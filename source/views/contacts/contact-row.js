// @flow

import * as React from 'react'
import type {ContactType} from './types'
import {ListRow, Detail, Title} from '../components/list'
import {Column, Row} from '../components/layout'

type Props = {
  onPress: ContactType => any,
  contact: ContactType,
}

export class ContactRow extends React.PureComponent<Props> {
  _onPress = () => this.props.onPress(this.props.contact)

  render() {
    const {contact} = this.props

    return (
      <ListRow arrowPosition="top" onPress={this._onPress}>
        <Row alignItems="center">
          <Column flex={1}>
            <Title lines={1}>{contact.title}</Title>
            <Detail lines={1}>{contact.synopsis}</Detail>
          </Column>
        </Row>
      </ListRow>
    )
  }
}
