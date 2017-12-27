// @flow

import * as React from 'react'
import {Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {Touchable} from '../touchable'
import {rightButtonStyles as styles} from './styles'

type Props = {
  onFavorite: () => any,
  favorited: boolean,
}

export class FavoriteButton extends React.PureComponent<Props> {
  render() {
    return (
      <Touchable
        highlight={false}
        onPress={() => {
          this.props.onFavorite()
        }}
        style={styles.button}
      >
        {Platform.OS === 'ios' ? (
          <Icon
            name={this.props.favorited ? 'ios-heart' : 'ios-heart-outline'}
            style={styles.icon}
          />
        ) : (
          <Icon
            name={this.props.favorited ? 'md-heart' : 'md-heart-outline'}
            style={styles.icon}
          />
        )}
      </Touchable>
    )
  }
}
