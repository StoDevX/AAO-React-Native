import React from 'react'
import {View, Text, Navigator} from 'react-native'
import {Touchable} from './touchable'

export default function NoRoute({navigator}) {
  return (
    <View style={{flex: 1, alignItems: 'stretch', justifyContent: 'center'}}>
      <Touchable
        style={{flex: 1, alignItems: 'center', justifyContent: 'center'}}
        onPress={() => navigator.pop()}
      >
        <Text style={{color: 'red', fontWeight: 'bold'}}>
          No Route Found
        </Text>
      </Touchable>
    </View>
  )
}

NoRoute.propTypes = {
  navigator: React.PropTypes.instanceOf(Navigator),
}
