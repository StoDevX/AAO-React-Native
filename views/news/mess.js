import React from 'react'
import {
  StyleSheet,
  View,
  ListView,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native'

import NavigatorScreen from '../components/navigator-screen'
import LoadingView from './loading'
import * as c from '../components/colors'
import tabs from './tabs'

let Entities = require('html-entities').AllHtmlEntities;
entities = new Entities()

export default class MessView extends React.Component {

  constructor(props) {
    super(props)
    this.state = {
      dataSource: null,
      loaded : false,
      error: false,
    }
  }

    componentWillMount() {
        this.fetchData()
    }

    _rowHasChanged(r1, r2) {
      return r1.title != r2.title
    }

    async fetchData() {
        try {
          let response = await fetch(tabs[2].url)
          let responseJson = await response.json()
          this.setState({dataSource: responseJson})
        } catch (error) {
          this.setState({error: true})
          console.error(error)
        }
        this.setState({loaded: true})
    }

     _renderRow(story){
        return(
            <TouchableOpacity onPress={this._onPressNews.bind(this)}>
                <View style={styles.pageContainer}>
                    <View style={styles.rightContainer}>
                        <Text style={styles.newsTitle}>{entities.decode(story.title)}</Text>
                        <Text style={styles.newsSummary}>{entities.decode(story.contentSnippet)}</Text>
                    </View>
                </View>
            </TouchableOpacity>
        )
    }

    _onPressNews(view) {
        // Figure out how to call this
        // most likely from the parent

        // this.props.navigator.push({
        //   title: viewTitle,
        //   component: NewsDetail,
        //   passProps: {news},
        // })

        console.log("show the news story...")
    }

  render() {
    if (this.state.dataSource != null) {
        let ds = new ListView.DataSource({
          rowHasChanged: this._rowHasChanged,
    })
    return (
      <View style={[styles.container, styles.newsItemContainer]}>
       <ListView
          {...this.props}
          dataSource={ds.cloneWithRows(this.state.dataSource.responseData.feed.entries)}
          renderRow={this._renderRow.bind(this)}
          style={styles.listView} />
       </View>
      )
    } else {
      return (
        <LoadingView />
      )
    }
  }
}

var styles = StyleSheet.create({
    pageContainer: {
        marginLeft : 10,
        marginRight : 10,
        borderBottomWidth: 1,
        borderBottomColor: '#ebebeb',
    },
    container: {
        flex: 1,
        flexDirection : 'row',
        justifyContent: 'center',
    },
    rightContainer: {
        flex: 1,
    },
    newsItemContainer: {
        paddingBottom: 50,
    },
    listView: {
        backgroundColor: '#ffffff',
    },
    newsPic: {
        width: 90,
        height: 60,
        margin: 10,
        marginLeft: 0,
    },
    newsTitle: {
        color: c.black,
        paddingLeft: 10,
        paddingRight: 10,
        paddingTop: 10,
        paddingBottom: 3,
        fontSize: 16,
        textAlign: 'left',
    },
    newsSummary: {
        color: c.iosText,
        paddingLeft: 10,
        paddingRight: 10,
        paddingBottom: 6,
        fontSize: 13,
        textAlign: 'left',
    },
})

