import React from 'react'
import {Cell} from 'react-native-tableview-simple'
import {StyleSheet, Text, View} from 'react-native'

type Props = {
  title: string,
  detail: string,
}

export class MultiLineDetailCell extends React.PureComponent<Props> {
  render () {
    const {title, detail} = this.props
    return (
      <Cell
        cellContentView={
          <View style={_styles.cellContentView}>
            <Text
              allowFontScaling={true}
              numberOfLines={1}
              style={_styles.cell_title}
            >
              {title}
            </Text>
            <Text
              allowFontScaling={true}
              numberOfLines={3}
              style={_styles.cell_rightDetail}
            >
              {detail}
            </Text>
          </View>
        }
      />
    )
  }
}

const _styles = StyleSheet.create({
  cellContentView: {
    alignItems: 'center',
    flexDirection: 'row',
    flex: 1,
    justifyContent: 'center',
    // independent from other cellViews
    paddingVertical: 10,
  },
  cell_title: {
    fontSize: 16,
    letterSpacing: -0.32,
    flex: 1,
  },
  cell_rightDetail: {
    fontSize: 16,
    letterSpacing: -0.32,
    alignSelf: 'center',
    color: '#8E8E93',
  },
  cell_rightDetail: {
    fontSize: 16,
    letterSpacing: -0.32,
    alignSelf: 'center',
    color: '#8E8E93',
  },
})
