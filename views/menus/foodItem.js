import React from 'react'
import { 
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native'

export default class FoodItem extends React.Component {
  getDietaryTags(){
    let tags = []
    for (let key in this.props.filters){
      if (this.props.data.dietary.hasOwnProperty(key)){
        tags.push(
          <Image
            key={key}
            source={this.props.filters[key].icon}
            style={styles.icons}
          />
        )
      }
    }
    return tags
  }

  render(){
    return (
      <View style={styles.container}>
      <View style={styles.name}>
      <Text style={styles.text}>
      {this.props.data.name}
      </Text>
      </View>
      <View style={styles.iconContainer}>
      {this.getDietaryTags()}
      </View>
      </View>
      )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
  },
  text: {
    marginLeft: 12,
    fontSize: 13,
    flexWrap: 'wrap',
  },
  name: {
    flex: 2,
    alignItems: 'stretch',
  },
  iconContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    flexDirection: 'row',
  },
  icons: {
    marginLeft: 7, 
    width: 15,
    height: 15,
  },
})

FoodItem.propTypes = {
  data: React.PropTypes.object.isRequired,
  filters: React.PropTypes.object.isRequired,
}