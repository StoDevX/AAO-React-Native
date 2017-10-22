// @flow

import React from 'react'
import {StyleSheet, ScrollView, Text, Image} from 'react-native'
import {TabBarIcon} from '../../components/tabbar-icon'
import LoadingView from '../../components/loading'
import {NoticeView} from '../../components/notice'
import type {Movie} from './types'

const MOVIE_URL = 'https://stodevx.github.io/sga-weekly-movies/next.json'

type Props = {}
type State = {
  loading: boolean,
  movie: ?Movie,
}
;[]

export class WeeklyMovieView extends React.Component<any, Props, State> {
  static navigationOptions = {
    tabBarLabel: 'Weekly Movie',
    tabBarIcon: TabBarIcon('film'),
  }

  state = {
    loading: true,
    movie: null,
  }

  componentWillMount() {
    this.fetchMovie()
  }

  fetchMovie = () =>
    fetchJson(MOVIE_URL)
      .then(({movie}) => fetchJson(movie))
      .then(info => this.setState(() => ({movie: info, loading: false})))

  render() {
    if (this.state.loading) {
      return <LoadingView />
    }

    const {movie} = this.state

    if (!movie) {
      return <NoticeView message="this should never happen" />
    }

    const poster = movie.posters.find(p => p.width == 512)
    const title = movie.info.Title

    return (
      <ScrollView contentContainerStyle={styles.container}>
        {poster && (
          <Image
            style={[
              styles.poster,
              {width: poster.width / 2, height: poster.height / 2},
            ]}
            resizeMode="contain"
            source={{uri: poster.url}}
          />
        )}
        <Text style={styles.title}>{title}</Text>
      </ScrollView>
    )
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
  },
  poster: {
    borderRadius: 4,
    marginTop: 12,
    marginBottom: 18,
  },
  title: {
    fontWeight: 'bold',
  },
})
