// @flow
import * as React from 'react'
import * as c from '../components/colors'
import {data as credits} from '../../../docs/credits.json'
import glamorous from 'glamorous-native'
import {Platform} from 'react-native'
import {iOSUIKit, material} from 'react-native-typography'

const image = require('../../../images/about/IconTrans.png')

const Container = glamorous.scrollView({
  backgroundColor: c.white,
  paddingHorizontal: 5,
  paddingVertical: 10,
})

const Logo = glamorous.image({
  width: 100,
  height: 100,
  alignSelf: 'center',
})

const Title = glamorous.text({
  ...Platform.select({
    ios: iOSUIKit.largeTitleEmphasizedObject,
    material: material.display4Object,
  }),
  textAlign: 'center',
  marginTop: 10,
  marginBottom: 5,
})

const Heading = glamorous.text({
  ...Platform.select({
    ios: iOSUIKit.subheadEmphasizedObject,
    android: material.titleObject,
  }),
})

const About = glamorous.text({
  ...Platform.select({
    ios: iOSUIKit.bodyObject,
    android: material.body1Object,
  }),
  paddingHorizontal: 25,
  paddingTop: 10,
})

const Contributors = glamorous(About)({
  ...Platform.select({
    ios: iOSUIKit.footnoteEmphasizedObject,
    android: material.body1Object,
  }),
  textAlign: 'center',
})

const formatPeopleList = arr => arr.map(w => w.replace(' ', ' ')).join(' • ')

export default function CreditsView() {
  return (
    <Container contentInsetAdjustmentBehavior="automatic">
      <Logo source={image} />

      <Title>{credits.name}</Title>
      <About>{credits.content}</About>

      <Heading>Contributors</Heading>
      <Contributors>{formatPeopleList(credits.contributors)}</Contributors>

      <Heading>Acknowledgements</Heading>
      <Contributors>{formatPeopleList(credits.acknowledgements)}</Contributors>
    </Container>
  )
}
CreditsView.navigationOptions = {
  title: 'Credits',
}
