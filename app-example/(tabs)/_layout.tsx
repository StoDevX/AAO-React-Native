import { Tabs } from 'expo-router';
import React from 'react';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Welcome',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'sunrise.fill' : 'sunrise'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'location.fill' : 'location'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="symbols"
        options={{
          title: 'Symbols',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'shazam.logo.fill' : 'shazam.logo'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
