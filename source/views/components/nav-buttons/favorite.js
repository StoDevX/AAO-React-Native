// @flow

import * as React from 'react'
import {Platform} from 'react-native'
import Icon from 'react-native-vector-icons/Ionicons'
import {Touchable} from '../touchable'
import {rightButtonStyles as styles} from './styles'

type State = {
  favorited: boolean,
}

type Props = {
  onFavorite: () => any,
  favorited: boolean,
}

export class FavoriteButton extends React.PureComponent<Props, State> {
  state = {
    favorited: this.props.favorited,
  }

  onPress = () => {
    if (this.state.favorited) {
      this.setState({favorited: false})
    } else {
      this.setState({favorited: true})
    }
  }

  render() {
    if (this.state.favorited) {
      return (
        <Touchable
          highlight={false}
          onPress={() => {
            this.onPress()
            this.props.onFavorite()
          }}
          style={styles.button}
        >
          {Platform.OS === 'ios' ? (
            <Icon name="ios-heart" style={styles.icon} />
          ) : (
            <Icon name="md-heart" style={styles.icon} />
          )}
        </Touchable>
      )
    } else {
      return (
        <Touchable
          highlight={false}
          onPress={() => {
            this.onPress()
            this.props.onFavorite()
          }}
          style={styles.button}
        >
          {Platform.OS === 'ios' ? (
            <Icon name="ios-heart-outline" style={styles.icon} />
          ) : (
            <Icon name="md-heart-outline" style={styles.icon} />
          )}
        </Touchable>
      )
    }
  }
}
