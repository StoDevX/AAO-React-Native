// @flow

import * as React from 'react'
import {Platform} from 'react-native'
import glamorous from 'glamorous-native'
import {SelectableText} from './selectable'
import {iOSUIKit, material} from 'react-native-typography'

export const Header = glamorous(SelectableText)({
  marginTop: 8,
  marginBottom: 4,
})

const h1 = {
  ...Platform.select({
    ios: iOSUIKit.largeTitleEmphasizedObject,
    android: material.headlineObject,
  }),
}

const h2 = {
  ...Platform.select({
    ios: iOSUIKit.title3EmphasizedObject,
    android: material.titleObject,
  }),
}

const h3 = {
  ...Platform.select({
    ios: iOSUIKit.title3Object,
    android: material.subheadingObject,
  }),
}

const h4 = {
  ...Platform.select({
    ios: iOSUIKit.subheadObject,
    android: material.buttonObject,
  }),
}

export const Heading = (props: any) => {
  switch (props.level) {
    case 1:
      return <Heading style={h1}>{props.children}</Heading>
    case 2:
      return <Heading style={h2}>{props.children}</H2>
    case 3:
      return <Heading style={h3}>{props.children}</H3>
    case 4:
    case 5:
    case 6:
    default:
      return <Heading style={h4}>{props.children}</Heading>
  }
}
