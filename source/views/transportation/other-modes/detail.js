// @flow
import * as React from 'react'
import {StyleSheet} from 'react-native'
import {Markdown} from '../../components/markdown'
import {ListFooter} from '../../components/list'
import glamorous from 'glamorous-native'
import {tracker} from '../../../analytics'
import {Button} from '../../components/button'
import openUrl from '../../components/open-url'
import type {OtherModeType} from '../types'

const AAO_URL = 'https://github.com/StoDevX/AAO-React-Native/issues/new'

const Title = glamorous.text({
  fontSize: 36,
  textAlign: 'center',
  marginHorizontal: 18,
  marginVertical: 10,
})

const Container = glamorous.scrollView({
  paddingHorizontal: 18,
  paddingVertical: 6,
})

const styles = StyleSheet.create({
  paragraph: {
    fontSize: 16,
  },
})

type Props = {navigation: {state: {params: {mode: OtherModeType}}}}

export class OtherModesDetailView extends React.PureComponent<Props> {
  static navigationOptions = ({navigation}) => {
    return {
      title: navigation.state.params.mode.name,
    }
  }

  onPress = () => {
    const {name, url} = this.props.navigation.state.params.mode
    tracker.trackScreenView(
      `Transportation_OtherModes_${name.replace(' ', '')}View`,
    )
    openUrl(url)
  }

  render() {
    const mode = this.props.navigation.state.params.mode
    return (
      <Container>
        <Title selectable={true}>{mode.name}</Title>

        <Markdown
          source={mode.description}
          styles={{Paragraph: styles.paragraph}}
        />

        <Button onPress={this.onPress} title={'More Info'} />

        <ListFooter
          href={AAO_URL}
          title="Collected by the humans of All About Olaf"
        />
      </Container>
    )
  }
}
