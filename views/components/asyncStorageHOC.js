// import React, { Component } from 'react'

// import {
//   AsyncStorage,
// } from 'react-native'

// import fromPairs from 'lodash/fromPairs'

// function AsyncStorageHOC(storageKeys: string[], defaultValues: any[]) {
//   class Composed extends React.Component {
//     state: {[key: string]: any} = fromPairs(storageKeys.map((k, i) => ([k, defaultValues[i]])))

//     componentWillMount() {
//       this.loadFromStorage()
//     }

//     loadFromStorage = async () => {
//       let promises = storageKeys.map((key, i) =>
//         AsyncStorage.get(key, defaultValues[i]))
//       let data = await Promise.all(promises)

//       let paired = data.map((value, i) => ([storageKeys[i], value]))
//       this.setState(fromPairs(paired))
//     }

//     render() {
//       return <Component {...this.props} {...this.state} />
//     }
//   }

//   return Composed
// }
