// @flow
import React from 'react'
import {Text, StyleSheet} from 'react-native'
import * as c from '../colors'

const styles = StyleSheet.create({
  footer: {
    fontSize: 10,
    color: c.iosDisabledText,
    textAlign: 'center',
    paddingVertical: 20,
    paddingBottom: 25,
  },
})

export class ListFooter extends React.PureComponent {
  props: {
    title: string,
    href?: string,
  }

  render() {
    const {title} = this.props
    return (
      <Text selectable={true} style={[styles.footer]}>
        {title}
      </Text>
    )
  }
}
