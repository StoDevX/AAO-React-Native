// @flow

import * as React from 'react'
import {Text} from 'react-native'

export class SelectableText extends React.PureComponent {
  render() {
    return <Text selectable={true} {...this.props} />
  }
}
