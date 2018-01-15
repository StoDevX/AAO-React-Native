// @flow

import React from 'react'

import {storiesOf} from '@storybook/react-native'
import {action} from '@storybook/addon-actions'
import {linkTo} from '@storybook/addon-links'

import CenterView from './CenterView'
import moment from 'moment-timezone'
moment.tz.setDefault('GMT')

import {Button} from '../../source/views/components/button'
import LoadingView from '../../source/views/components/loading'
import {NoticeView} from '../../source/views/components/notice'
import {BusStopRow} from '../../source/views/transportation/bus/components/bus-stop-row.js'
import {ProgressChunk} from '../../source/views/transportation/bus/components/progress-chunk.js'
import NewsContainer from '../../source/views/news/news-container.js'

storiesOf('Button', module)
  .addDecorator(getStory => <CenterView>{getStory()}</CenterView>)
  .add('with text', () => (
    <Button onPress={action('clicked-text')} title="Hello Button" />
  ))
  .add('with some emoji', () => (
    <Button onPress={action('clicked-emoji')} title="😀 😎 👍 💯" />
  ))
  .add('disabled', () => (
    <Button
      disabled={true}
      onPress={action('clicked-disabled')}
      title="Disabled Button"
    />
  ))

storiesOf('LoadingView', module)
  .add('default', () => <LoadingView active={false} />)
  .add('with custom text', () => (
    <LoadingView active={false} text="Custom Text" />
  ))

storiesOf('NoticeView', module)
  .add('with text', () => <NoticeView text="Notice!" />)
  .add('with a button', () => (
    <NoticeView
      buttonText="Button"
      onPress={action('notice-clicked')}
      text="Notice!"
    />
  ))
  .add('with a spinner', () => (
    <NoticeView spinner={true} spinnerActive={false} text="blah" />
  ))
  .add('with both a button and a spinner', () => (
    <NoticeView
      buttonText="Button"
      onPress={action('notice-clicked-loading')}
      spinner={true}
      spinnerActive={false}
      text="Notice!"
    />
  ))

storiesOf('BusStopRow', module)
  .addDecorator(getStory => <CenterView>{getStory()}</CenterView>)
  .add('active', () => (
    <BusStopRow
      barColor="black"
      currentStopColor="gray"
      departureIndex={1}
      isFirstRow={false}
      isLastRow={false}
      now={moment('2017-08-10T12:00:00Z')}
      status="running"
      stop={{
        name: 'Stop Title',
        departures: [
          moment('2017-08-10T12:00:00Z'),
          moment('2017-08-10T12:00:00Z').add(1, 'minutes'),
          moment('2017-08-10T12:00:00Z').add(5, 'minutes'),
        ],
      }}
    />
  ))

storiesOf('ProgressChunk', module)
  .addDecorator(getStory => <CenterView>{getStory()}</CenterView>)
  .add('at stop', () => (
    <ProgressChunk
      barColor="black"
      currentStopColor="gray"
      isFirstChunk={true}
      isLastChunk={false}
      stopStatus="at"
    />
  ))
  .add('before stop', () => (
    <ProgressChunk
      barColor="black"
      currentStopColor="gray"
      isFirstChunk={true}
      isLastChunk={false}
      stopStatus="before"
    />
  ))
  .add('after stop', () => (
    <ProgressChunk
      barColor="black"
      currentStopColor="gray"
      isFirstChunk={true}
      isLastChunk={false}
      stopStatus="after"
    />
  ))

global.fetchJson = url => fetch(url).then(r => r.json())

storiesOf('News', module).add('St. Olaf', () => (
  <NewsContainer
    mode="wp-json"
    name="St. Olaf"
    query={{per_page: 10, _embed: true}}
    url="https://wp.stolaf.edu/wp-json/wp/v2/posts"
  />
))
