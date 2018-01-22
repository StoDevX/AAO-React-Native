// @flow

import * as React from 'react'
import {
  StyleSheet,
  ScrollView,
  Picker,
  View,
  Text,
  ListView,
} from 'react-native'
import {TabBarIcon} from '../../components/tabbar-icon'
import {Cell, TableView, Section} from 'react-native-tableview-simple'
import * as c from '../../components/colors'
import {Select, Option} from 'react-native-chooser'
import {CourseSearchBar} from '../components/searchbar'
import debounce from 'lodash/debounce'


export default class CourseSearchView extends React.PureComponent {
  static navigationOptions = {
		tabBarLabel: 'Course Search',
		tabBarIcon: TabBarIcon('search'),
	}

  searchBar: any = null

  _performSearch = (text: string | Object) => {
		// Android clear button returns an object
		// if (typeof text !== 'string') {
		// 	return this.props.onSearch(null)
		// }
    console.log(text)


	}

	// We need to make the search run slightly behind the UI,
	// so I'm slowing it down by 50ms. 0ms also works, but seems
	// rather pointless.
	performSearch = debounce(this._performSearch, 50)

  onFocus = () => {
    // this._header.setNativeProps({style: {display: 'none',},})
  }

  render() {

    return (

        <TableView>


          <View style={[styles.searchContainer, styles.common]}>
            <Text
              style={styles.header}
              ref={component => this._header = component}
            >
              Search Courses
            </Text>
            <CourseSearchBar
              getRef={ref => (this.searchBar = ref)}
              onChangeText={this.performSearch}
              onFocus={this.onFocus}
              onSearchButtonPress={() => this.searchBar.unFocus()}
              style={styles.searchBar}
            >
            </CourseSearchBar>
          </View>

          


          <Section header="Year/Term">
            <View>
              <Picker
                selectedValue = "20173"
                onValueChange={(value) => console.log(value)}
                style={[styles.common, styles.picker]}
                itemStyle={styles.picker}
              >
                <Picker.Item label="Interim 2017" value="20172"/>
                <Picker.Item label="Spring 2017" value="20173"/>
              </Picker>
            </View>
          </Section>

        </TableView>


    )

  }
}

let cellMargin = 10
let cellSidePadding = 10
let cellEdgePadding = 10

let styles = StyleSheet.create({
  common: {
    backgroundColor: c.white,
  },

  searchContainer: {
    margin: 0,
    padding: 25,
  },

  searchBar: {
    backgroundColor: c.white,
  },

  header: {
    fontSize: 30,
    fontWeight: 'bold',
    padding: 5,
  },

  picker: {
    height: 90,
  },

  rectangle: {
		flex: 1,
    height: 88,
		alignItems: 'center',
		marginBottom: cellMargin,
	},

})
