// @flow
import React from 'react'
import {Text, StyleSheet} from 'react-native'
import * as c from '../colors'

const styles = StyleSheet.create({
  footer: {
    fontSize: 10,
    color: c.iosDisabledText,
    textAlign: 'center',
  },
  poweredBy: {
    paddingBottom: 20,
  },
})

export class ListFooter extends React.PureComponent {
  props: {
    title: string,
    href: string,
  }

  render() {
    const {title} = this.props
    return (
      <Text selectable={true} style={[styles.footer, styles.poweredBy]}>
        {title}
      </Text>
    )
  }
}
