#!/usr/bin/env python3
"""
Screen Scaffolding Script for All About Olaf React Native App

This script creates the basic file structure and templates for a new screen.
Usage: python scaffold_screen.py <screen_name> [title]

Example: python scaffold_screen.py user-profile "User Profile"
"""

import os
import sys
import re
from pathlib import Path

def to_pascal_case(snake_str):
    """Convert snake_case to PascalCase"""
    return ''.join(word.capitalize() for word in snake_str.split('_'))

def to_camel_case(snake_str):
    """Convert snake_case to camelCase"""
    components = snake_str.split('_')
    return components[0] + ''.join(word.capitalize() for word in components[1:])

def create_screen_files(screen_name, title):
    """Create the basic screen files"""

    # Convert names
    pascal_name = to_pascal_case(screen_name)
    camel_name = to_camel_case(screen_name)

    # Create directory
    screen_dir = Path(f"source/views/{screen_name}")
    screen_dir.mkdir(parents=True, exist_ok=True)

    # Create index.tsx
    index_template = '''import * as React from 'react'
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

function $PASCAL$Page(): JSX.Element {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>$TITLE$</Text>
      <View style={styles.content}>
        {/* TODO: Add your screen content here */}
        <Text>$TITLE$ screen content goes here</Text>
      </View>
    </View>
  )
}

export {$PASCAL$Page as View}

export const NavigationKey = '$PASCAL$'

export const NavigationOptions: NativeStackNavigationOptions = {
  title: '$TITLE$',
}

export type NavigationParams = undefined
'''

    index_content = index_template.replace('$PASCAL$', pascal_name).replace('$TITLE$', title)

    (screen_dir / "index.tsx").write_text(index_content)

    # Create types.ts if needed (basic template)
    types_template = '''// Types for {title} screen

// Add any screen-specific types here
// export type SomeType = {{
//   id: string
//   name: string
// }}
'''

    types_content = types_template.format(title=title)

    (screen_dir / "types.ts").write_text(types_content)

    print(f"✅ Created screen files for '{screen_name}' in {screen_dir}")
    print("\nNext steps:")
    print("1. Implement your screen logic in index.tsx")
    print("2. Add types to types.ts if needed")
    print("3. Update navigation/types.tsx to include the new screen")
    print("4. Update navigation/routes.tsx to add the route")
    print("5. Update views/views.ts if this should appear on home screen")
    print("6. Test the implementation")

def main():
    if len(sys.argv) < 2:
        print("Usage: python scaffold_screen.py <screen_name> [title]")
        print("Example: python scaffold_screen.py user_profile \"User Profile\"")
        sys.exit(1)

    screen_name = sys.argv[1].lower().replace(' ', '_')
    title = sys.argv[2] if len(sys.argv) > 2 else to_pascal_case(screen_name).replace('_', ' ')

    # Validate screen name
    if not re.match(r'^[a-z][a-z0-9_]*$', screen_name):
        print("Error: screen_name must be lowercase letters, numbers, and underscores only, starting with a letter")
        sys.exit(1)

    create_screen_files(screen_name, title)

if __name__ == "__main__":
    main()