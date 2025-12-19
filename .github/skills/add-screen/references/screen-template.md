# Screen Component Template

Use this template as a starting point for new screen components. Replace placeholders with your specific implementation.

```tsx
import * as React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  content: {
    flex: 1,
  },
})

function [ScreenName]Page(): JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>[Screen Title]</Text>
      <View style={styles.content}>
        {/* Your screen content here */}
        <Text>[Screen content goes here]</Text>
      </View>
    </View>
  )
}

export {[ScreenName]Page as View}

export const NavigationKey = '[ScreenName]'

export const NavigationOptions: NativeStackNavigationOptions = {
  title: '[Screen Title]',
  headerBackTitle: '[Back Title]',
}

export type NavigationParams = undefined
```

## Template Usage

1. Replace `[ScreenName]` with your actual screen name (e.g., `Settings`, `Profile`)
2. Replace `[Screen Title]` with the display title
3. Replace `[Back Title]` with appropriate back button text
4. Add your screen-specific content in the `content` View
5. Modify styles as needed following the project's patterns

## With Navigation Parameters

If your screen needs parameters, modify the template:

```tsx
export type NavigationParams = {
  itemId: string
  title?: string
}

function [ScreenName]Page({route}: {route: {params: NavigationParams}}): JSX.Element {
  const {itemId, title} = route.params

  // Use parameters in your component
  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title || '[Screen Title]'}</Text>
      <Text>Item ID: {itemId}</Text>
    </View>
  )
}
```