// @flow

import * as React from 'react'
import {ScrollView, View, Text, StyleSheet, Image} from 'react-native'
import {StackNavigator} from 'react-navigation'

import {TabBarIcon} from '../../views/components/tabbar-icon'

type Props = {}
type State = {}

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  cardShape: {
    borderRadius: 15,
    shadowColor: '#bbb',
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  cardLook: {
    backgroundColor: 'white',
    overflow: 'hidden',
  },
  heading: {
    marginTop: 20,
    marginBottom: 5,
  },
  headingText: {
    fontFamily: 'System',
    fontWeight: '900',
    fontSize: 24,
  },
  cardHeading: {
    fontFamily: 'System',
    fontWeight: '200',
    fontSize: 18,
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  cardContent: {
    ...StyleSheet.absoluteFillObject,
    padding: 15,
  },
})

const cardStyles = StyleSheet.create({
  about: {
    height: 200,
  },
  news: {
    height: 120,
    width: 120,
    marginRight: 20,
  },
  termOfTheDay: {
    height: 200,
  },
  building: {
    height: 200,
  },
  directory: {
    height: 120,
    width: 120,
    marginRight: 20,
  },
  webcam: {
    height: 120,
    width: 120,
    marginRight: 20,
  },
})

const Card = ({children, style}) => (
  <View style={[styles.cardShape, styles.cardLook, style]}>
    <View style={styles.cardContent}>{children}</View>
  </View>
)

const ImageBackgroundCard = ({title, style, imageSrc}) => (
  <Card style={style}>
    <Image source={imageSrc} />
    <Text style={styles.cardHeading}>{title}</Text>
  </Card>
)

const AboutCard = ({title}) => (
  <ImageBackgroundCard
    title={title}
    style={cardStyles.about}
    imageSrc={{
      uri:
        'https://i2.wp.com/wp.stolaf.edu/wp-content/uploads/2012/10/Pop-up-6_01.jpg?resize=1600%2C900&ssl=1',
    }}
  />
)

const NewsCard = ({title, image}) => (
  <ImageBackgroundCard
    title={title}
    style={cardStyles.news}
    imageSrc={{uri: image}}
  />
)

const TermOfTheDayCard = ({title, content, image}) => (
  <Card style={cardStyles.termOfTheDay}>
    {image ? <Image source={{uri: image}} /> : null}
    {content ? <Text>{content}</Text> : null}
    <Text style={styles.cardHeading}>{title}</Text>
  </Card>
)

const BuildingCard = ({building}) => (
  <Card style={cardStyles.building}>
    <Text style={styles.cardHeading}>{building}</Text>
  </Card>
)

const WebcamInfoCard = ({title}) => (
  <Card style={cardStyles.webcam}>
    <Text style={styles.cardHeading}>{title}</Text>
  </Card>
)

const WebcamThumbnailCard = ({stream}) => (
  <ImageBackgroundCard
    style={cardStyles.webcam}
    title={stream}
    image="https://"
  />
)

const DirectorySearchCard = ({title}) => (
  <Card style={cardStyles.directory}>
    <Text style={styles.cardHeading}>{title}</Text>
  </Card>
)
const DirectoryDepartmentCard = ({deptname}) => (
  <Card style={cardStyles.directory}>
    <Text style={styles.cardHeading}>{deptname}</Text>
  </Card>
)

const Heading = ({title}) => (
  <View style={styles.heading}>
    <Text style={styles.headingText}>{title}</Text>
  </View>
)

const HorizontalSwiper = ({children}) => (
  <View style={{flexDirection: 'row'}}>{children}</View>
)

const Block = ({children}) => (
  <View style={{flexDirection: 'column'}}>{children}</View>
)

class AboutScreen extends React.PureComponent<Props, State> {
  render() {
    return (
      <ScrollView style={styles.container}>
        <Block>
          <AboutCard title="About St. Olaf" />
        </Block>

        <Block>
          <Heading title="News" />
          <HorizontalSwiper>
            <NewsCard
              title="St. Olaf ranks #1 in study about things"
              image="https://"
            />
            <NewsCard
              title="Ringing in the season through stuff"
              image="https://"
            />
            <NewsCard
              title="Professor publishes new book; wows students"
              image="https://"
            />
          </HorizontalSwiper>
        </Block>

        <Block>
          <Heading title="Term of the Day" />
          <TermOfTheDayCard
            title="Big Ole"
            content="Big Ole is big."
            image="https://"
          />
        </Block>

        <Block>
          <Heading title="A Building" />
          <BuildingCard building="Buntrock Commons" />
        </Block>

        <Block>
          <Heading title="Slices of Campus" />
          <HorizontalSwiper>
            <WebcamInfoCard title="What are webcams?" image="https://" />
            <WebcamThumbnailCard stream="himom" />
            <WebcamThumbnailCard stream="alumniwest" />
          </HorizontalSwiper>
        </Block>

        <Block>
          <Heading title="Directory" />
          <HorizontalSwiper>
            <DirectorySearchCard title="Find someone!" />
            <DirectoryDepartmentCard deptname="Admissions" />
          </HorizontalSwiper>
        </Block>
      </ScrollView>
    )
  }
}

const Blank = () => (
  <View>
    <Text>blank</Text>
  </View>
)

const navigator = StackNavigator({
  Root: {
    screen: AboutScreen,
    navigationOptions: {
      title: 'About (the college)',
    },
  },
  AboutTheCollege: {
    screen: Blank,
    path: 'about',
    navigationOptions: {
      title: 'About St. Olaf',
    },
  },
  NewsList: {
    screen: Blank,
    path: 'news/:source',
    navigationOptions: ({navigation}) => ({
      title: `${navigation.state.params.source}`,
    }),
  },
  NewsSingle: {
    screen: Blank,
    path: 'news/:source/:slug',
  },
  DictionaryList: {
    screen: Blank,
    path: 'dictionary',
  },
  DictionarySingle: {
    screen: Blank,
    path: 'dictionary/:term',
  },
  BuildingList: {
    screen: Blank,
    path: 'buildings',
  },
  BuildingSingle: {
    screen: Blank,
    path: 'building/:id',
  },
  WebcamList: {
    screen: Blank,
    path: 'webcams',
  },
  WebcamSingle: {
    screen: Blank,
    path: 'webcams/:id',
  },
  DirectorySearch: {
    screen: Blank,
    path: 'directory/search',
  },
  DirectorySingle: {
    screen: Blank,
    path: 'directory/user/:username',
  },
  DirectoryDepartment: {
    screen: Blank,
    path: 'directory/department/:deptname',
  },
})

export {navigator as AboutTab}
