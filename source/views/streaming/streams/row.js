// @flow

import * as React from 'react'
import {StyleSheet, Image} from 'react-native'

import {ListRow, Detail, Title} from '../../components/list'
import {Column, Row} from '../../components/layout'
import {getTrimmedTextWithSpaces, parseHtml} from '../../../lib/html'
import {trackedOpenUrl} from '../../components/open-url'
import type {StreamType} from './types'

const styles = StyleSheet.create({
  image: {
    marginRight: 12,
    height: 40,
    width: 70,
  },
})

function Name({item}: {item: StreamType}) {
  const title = getTrimmedTextWithSpaces(parseHtml(item.title))
  return title ? <Title>{title}</Title> : null
}

function Info({item}: {item: StreamType}) {
  const detail = getTrimmedTextWithSpaces(
    parseHtml(item.subtitle || item.performer || ''),
  )
  return detail ? <Detail>{detail}</Detail> : null
}

function Time({item}: {item: StreamType}) {
  const showTime = item.status != 'archived'
  return showTime ? (
    <Detail>{item.date.format('h:mm A – ddd, MMM. Do, YYYY')}</Detail>
  ) : null
}

function Thumbnail({item}: {item: StreamType}) {
  return item.thumb ? (
    <Image source={{uri: item.thumb}} style={styles.image} />
  ) : null
}

type Props = {stream: StreamType}

export class StreamRow extends React.PureComponent<Props> {
  onPressStream = () => {
    const {stream} = this.props
    trackedOpenUrl({url: stream.player, id: 'StreamingMedia_StreamView'})
  }

  render() {
    const {stream} = this.props

    return (
      <ListRow arrowPosition="center" onPress={this.onPressStream}>
        <Row alignItems="center">
          <Thumbnail item={stream} />
          <Column flex={1}>
            <Name item={stream} />
            <Info item={stream} />
            <Time item={stream} />
          </Column>
        </Row>
      </ListRow>
    )
  }
}
