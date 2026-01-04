---
name: add-screen
description: Guide for adding a new screen to the All About Olaf React Native app, including React Navigation setup, TypeScript types, component creation, and proper integration with the app's navigation system.
license: Complete terms in LICENSE.txt
---

# Add Screen Skill

This skill provides a comprehensive guide for adding new screens to the All About Olaf React Native application. It covers all necessary steps including component creation, navigation setup, TypeScript types, and integration with the app's existing architecture.

## When to Use This Skill

Use this skill when you need to add a new screen/view to the AAO React Native app. This includes:
- Creating new top-level screens accessible from the home screen
- Adding detail screens or sub-screens
- Setting up proper navigation with React Navigation
- Ensuring TypeScript type safety
- Following the project's established patterns and conventions

## Prerequisites

Before using this skill, ensure you have:
- A clear understanding of what the screen should do
- Any required data types or API integrations
- Whether the screen should be accessible from the home screen or as a sub-screen

## Process

### Step 1: Plan the Screen Structure

**Determine the screen requirements:**
- Screen name and purpose
- Navigation parameters (if any)
- Whether it needs to be in the home screen menu
- Icon and colors for home screen button (if applicable)
- Any sub-screens or related components

**Choose appropriate navigation type:**
- Stack navigation for hierarchical screens
- Tab navigation for peer screens
- Modal presentation for overlays

### Step 2: Create the View Directory and Component

**Create the view directory structure:**
```
source/views/[screen-name]/
├── index.tsx          # Main component export
├── types.ts          # TypeScript types (if needed)
└── [other-components].tsx  # Additional components
```

**Implement the main component following the pattern:**
- Export `View` as the main component
- Export `NavigationKey` as a string identifier
- Export `NavigationOptions` for navigation configuration
- Export `NavigationParams` type (usually `undefined` for simple screens)

**Example component structure:**
```tsx
import * as React from 'react'
import {View, Text, StyleSheet} from 'react-native'
import {NativeStackNavigationOptions} from '@react-navigation/native-stack'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
})

function MyScreen(): JSX.Element {
  return (
    <View style={styles.container}>
      <Text>My New Screen</Text>
    </View>
  )
}

export {MyScreen as View}

export const NavigationKey = 'MyScreen'

export const NavigationOptions: NativeStackNavigationOptions = {
  title: 'My Screen',
}

export type NavigationParams = undefined
```

### Step 3: Add Navigation Types

**Update `source/navigation/types.tsx`:**
- Import the new view module
- Add the screen to `RootViewsParamList` or appropriate param list
- Define navigation parameters if needed

**Example additions:**
```tsx
import * as myScreen from '../views/my-screen'

// In RootViewsParamList
MyScreen: myScreen.NavigationParams
```

### Step 4: Add the Route

**Update `source/navigation/routes.tsx`:**
- Import the new view
- Add a `Stack.Screen` component in the appropriate navigator
- Configure the screen with component, name, and options

**Example route addition:**
```tsx
import * as myScreen from '../views/my-screen'

// In the appropriate Stack.Navigator
<Stack.Screen
  component={myScreen.View}
  name={myScreen.NavigationKey}
  options={myScreen.NavigationOptions}
/>
```

### Step 5: Add to Home Screen Menu (if applicable)

**Update `source/views/views.ts`:**
- Import the NavigationKey
- Add an entry to the `AllViews()` array with appropriate metadata

**Example view addition:**
```tsx
import {NavigationKey as myScreen} from './my-screen'

// In AllViews() array
{
  type: 'view',
  view: myScreen,
  title: 'My Screen',
  icon: 'star', // Choose appropriate icon
  foreground: 'light',
  tint: c.blueToNavy[0], // Choose appropriate color
},
```

### Step 6: Test and Validate

**Run the app and test navigation:**
- Ensure the screen appears in the home menu (if added)
- Test navigation to and from the screen
- Verify proper back navigation
- Check for TypeScript errors

**Validate integration:**
- Screen follows established patterns
- No linting errors
- Proper error handling
- Accessibility considerations

## Common Patterns and Best Practices

### Screen Naming Conventions
- Use PascalCase for component names
- Use camelCase for file names
- Use descriptive, specific names

### Navigation Options
- Always set a meaningful `title`
- Consider `headerBackTitle` for custom back button text
- Use `headerRight` for action buttons when appropriate

### Type Safety
- Define specific parameter types when screens need data
- Use `undefined` for screens that don't need parameters
- Export types for use in navigation calls

### Component Organization
- Keep components focused and single-responsibility
- Use hooks for state management
- Follow existing styling patterns

### Error Handling
- Implement proper error boundaries
- Handle loading states appropriately
- Provide user-friendly error messages

## Troubleshooting

### Common Issues

**Screen not appearing in navigation:**
- Check that NavigationKey matches between types, routes, and views
- Verify imports are correct
- Ensure screen is added to the correct navigator

**TypeScript errors:**
- Check parameter type definitions
- Verify navigation type imports
- Ensure component exports match expected interface

**Styling issues:**
- Follow existing StyleSheet patterns
- Use platform-specific styles when needed
- Test on both iOS and Android

### Getting Help

If you encounter issues:
1. Check existing screens for reference patterns
2. Review the navigation setup in similar screens
3. Test incrementally - add one piece at a time
4. Run the app frequently to catch issues early

## Examples

See existing screens in `source/views/` for reference implementations:
- `home/` - Main screen with navigation buttons
- `menus/` - Screen with sub-navigation
- `settings/` - Settings screen with multiple sub-screens

Each example demonstrates different navigation patterns and component structures.