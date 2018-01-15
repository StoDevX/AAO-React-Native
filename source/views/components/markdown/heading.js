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

const H1 = glamorous(Header)({
  ...Platform.select({
    ios: iOSUIKit.largeTitleEmphasizedObject,
    android: material.display4Object,
  }),
})

const H2 = glamorous(Header)({
  ...Platform.select({
    ios: iOSUIKit.title3EmphasizedObject,
    android: material.display3Object,
  }),
})

const H3 = glamorous(Header)({
  ...Platform.select({
    ios: iOSUIKit.title3Object,
    android: material.display2Object,
  }),
})

const H4 = glamorous(Header)({
  ...Platform.select({
    ios: iOSUIKit.subheadObject,
    android: material.display1Object,
  }),
})

const H5 = glamorous(Header)({
  ...Platform.select({
    ios: iOSUIKit.subheadObject,
    android: material.headlineObject,
  }),
})

const H6 = glamorous(Header)({
  ...Platform.select({
    ios: iOSUIKit.subheadObject,
    android: material.titleObject,
  }),
})

export const Heading = (props: any) => {
  switch (props.level) {
    case 1:
      return <H1>{props.children}</H1>
    case 2:
      return <H2>{props.children}</H2>
    case 3:
      return <H3>{props.children}</H3>
    case 4:
      return <H4>{props.children}</H4>
    case 5:
      return <H5>{props.children}</H5>
    case 6:
      return <H6>{props.children}</H6>
    default:
      return <Heading>{props.children}</Heading>
  }
}
