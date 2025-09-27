# Mobile-Specific Development Guidelines

## Mobile Development Fundamentals

### Understanding Mobile Constraints
Mobile development differs significantly from web development due to:
- Limited processing power and memory
- Battery consumption concerns
- Variable network connectivity
- Touch-based interactions
- Platform-specific design patterns
- App store review processes

### Performance Considerations
1. **Memory Management**
   - Mobile devices have limited RAM
   - Clean up resources when components unmount
   - Avoid memory leaks in listeners and subscriptions
   - Use `FlatList` instead of `ScrollView` for long lists

2. **CPU Optimization**
   - Minimize unnecessary re-renders
   - Use `useCallback` and `useMemo` judiciously
   - Avoid heavy computations on the main thread
   - Optimize image loading and processing

3. **Battery Efficiency**
   - Minimize background processing
   - Reduce network requests
   - Use efficient data structures
   - Avoid continuous animations when app is backgrounded

## React Native Architecture

### Understanding the Bridge
React Native uses a bridge to communicate between JavaScript and native code:
- JavaScript thread handles business logic
- Native thread handles UI rendering
- Bridge can become a bottleneck with frequent communication
- Minimize bridge traffic for better performance

### Threading Model
```typescript
// Heavy operations should be moved off the main thread
import {InteractionManager} from 'react-native';

// Wait for interactions to complete before heavy work
InteractionManager.runAfterInteractions(() => {
  // Heavy computation here
  processLargeDataSet();
});
```

## Platform-Specific Development

### iOS Considerations

#### Design Patterns
- Navigation bars at the top
- Tab bars at the bottom
- Modal presentations
- Swipe gestures for navigation

#### iOS-Specific Code
```typescript
// Use .ios.tsx extension for iOS-only components
import {Platform} from 'react-native';

const styles = StyleSheet.create({
  container: {
    ...Platform.select({
      ios: {
        paddingTop: 44, // iOS status bar
      },
    }),
  },
});
```

#### iOS Safe Areas
```typescript
import {useSafeAreaInsets} from 'react-native-safe-area-context';

const MyComponent = () => {
  const insets = useSafeAreaInsets();
  
  return (
    <View style={{paddingTop: insets.top}}>
      {/* Content */}
    </View>
  );
};
```

### Android Considerations

#### Design Patterns
- Material Design guidelines
- Floating Action Buttons
- Navigation drawers
- Android back button handling

#### Android-Specific Code
```typescript
// Handle Android back button
import {BackHandler} from 'react-native';
import {useFocusEffect} from '@react-navigation/native';

const MyScreen = () => {
  useFocusEffect(
    React.useCallback(() => {
      const onBackPress = () => {
        // Custom back button handling
        return true; // Prevent default behavior
      };

      BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => BackHandler.removeEventListener('hardwareBackPress', onBackPress);
    }, [])
  );
};
```

#### Android Permissions
```typescript
import {PermissionsAndroid} from 'react-native';

const requestCameraPermission = async () => {
  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    {
      title: 'Camera Permission',
      message: 'App needs camera permission to take photos',
      buttonNeutral: 'Ask Me Later',
      buttonNegative: 'Cancel',
      buttonPositive: 'OK',
    }
  );
  
  return granted === PermissionsAndroid.RESULTS.GRANTED;
};
```

## User Interface Best Practices

### Touch Interactions
```typescript
// Ensure touch targets are at least 44x44 points
const styles = StyleSheet.create({
  touchable: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

// Provide visual feedback for touches
<TouchableOpacity
  onPress={handlePress}
  activeOpacity={0.7}
  style={styles.touchable}
>
  <Text>Button</Text>
</TouchableOpacity>
```

### Responsive Design
```typescript
import {Dimensions} from 'react-native';

const {width, height} = Dimensions.get('window');

// Responsive styling
const styles = StyleSheet.create({
  container: {
    width: width > 768 ? '50%' : '100%', // Tablet vs phone
  },
});

// Listen for orientation changes
const [dimensions, setDimensions] = useState(Dimensions.get('window'));

useEffect(() => {
  const subscription = Dimensions.addEventListener('change', ({window}) => {
    setDimensions(window);
  });
  
  return () => subscription?.remove();
}, []);
```

### Accessibility
```typescript
// Always include accessibility props
<TouchableOpacity
  accessible={true}
  accessibilityLabel="Add new item"
  accessibilityHint="Double tap to add a new item to your list"
  accessibilityRole="button"
  onPress={addItem}
>
  <Text>Add Item</Text>
</TouchableOpacity>

// Group related elements
<View
  accessible={true}
  accessibilityLabel="Student job: Campus Tour Guide at Admissions office"
>
  <Text>Campus Tour Guide</Text>
  <Text>Admissions</Text>
</View>
```

## Data Management

### Network Considerations
```typescript
import NetInfo from '@react-native-community/netinfo';

// Check network connectivity
const [isConnected, setIsConnected] = useState(true);

useEffect(() => {
  const unsubscribe = NetInfo.addEventListener(state => {
    setIsConnected(state.isConnected ?? false);
  });

  return unsubscribe;
}, []);

// Handle offline scenarios
const fetchData = async () => {
  if (!isConnected) {
    // Use cached data or show offline message
    return getCachedData();
  }
  
  try {
    return await apiCall();
  } catch (error) {
    // Fallback to cached data on error
    return getCachedData();
  }
};
```

### Local Storage
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store data locally
const storeData = async (key: string, value: any) => {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to store data:', error);
  }
};

// Retrieve data
const getData = async (key: string) => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ? JSON.parse(value) : null;
  } catch (error) {
    console.error('Failed to retrieve data:', error);
    return null;
  }
};
```

### Secure Storage
```typescript
import * as Keychain from 'react-native-keychain';

// Store sensitive data securely
const storeCredentials = async (username: string, password: string) => {
  try {
    await Keychain.setCredentials('myApp', username, password);
  } catch (error) {
    console.error('Failed to store credentials:', error);
  }
};

// Retrieve sensitive data
const getCredentials = async () => {
  try {
    const credentials = await Keychain.getCredentials('myApp');
    if (credentials) {
      return {
        username: credentials.username,
        password: credentials.password,
      };
    }
  } catch (error) {
    console.error('Failed to retrieve credentials:', error);
  }
  return null;
};
```

## Performance Optimization

### List Performance
```typescript
import {FlatList} from 'react-native';

// Optimize FlatList performance
<FlatList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  // Performance optimizations
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
  removeClippedSubviews={true}
  maxToRenderPerBatch={10}
  windowSize={10}
  initialNumToRender={10}
  updateCellsBatchingPeriod={50}
/>

// Memoize list items
const ListItem = React.memo(({item, onPress}) => (
  <TouchableOpacity onPress={() => onPress(item)}>
    <Text>{item.title}</Text>
  </TouchableOpacity>
));
```

### Image Optimization
```typescript
import {Image} from 'react-native';

// Use appropriate image sizes
<Image
  source={{uri: imageUrl}}
  style={{width: 100, height: 100}}
  resizeMode="cover"
  // Cache images
  cache="default"
  // Show placeholder while loading
  defaultSource={require('./placeholder.png')}
/>

// For large images, consider lazy loading
const LazyImage = ({source, style}) => {
  const [loaded, setLoaded] = useState(false);
  
  return (
    <View style={style}>
      {!loaded && <PlaceholderView />}
      <Image
        source={source}
        style={[style, {opacity: loaded ? 1 : 0}]}
        onLoad={() => setLoaded(true)}
      />
    </View>
  );
};
```

### Memory Management
```typescript
// Clean up subscriptions and listeners
useEffect(() => {
  const subscription = someService.subscribe(callback);
  
  return () => {
    subscription.unsubscribe();
  };
}, []);

// Use weak references for callbacks when possible
const handleCallback = useCallback((data) => {
  // Handle data
}, [dependency]);

// Avoid creating objects in render
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
}); // Created once, not on every render
```

## Testing on Mobile Devices

### Device Testing
1. **iOS Testing**
   - Test on various iPhone models (different screen sizes)
   - Test on iPad (if tablet support is needed)
   - Test on different iOS versions
   - Use iOS Simulator for development, real devices for final testing

2. **Android Testing**
   - Test on phones with different screen densities
   - Test on different Android versions
   - Test on devices with different hardware capabilities
   - Use Android Emulator for development, real devices for final testing

### Performance Testing
```typescript
// Monitor performance in development
import {InteractionManager} from 'react-native';

const logPerformance = (name: string) => {
  const start = Date.now();
  
  return () => {
    const end = Date.now();
    console.log(`${name} took ${end - start}ms`);
  };
};

// Use in components
const MyComponent = () => {
  useEffect(() => {
    const stopTimer = logPerformance('MyComponent render');
    
    return stopTimer;
  }, []);
};
```

## Deployment Considerations

### App Store Guidelines
1. **iOS App Store**
   - Follow Human Interface Guidelines
   - Ensure proper app icons and launch screens
   - Handle app review requirements
   - Consider app thinning and asset optimization

2. **Google Play Store**
   - Follow Material Design guidelines
   - Optimize APK size
   - Handle different screen densities
   - Consider Android App Bundle

### Build Optimization
```javascript
// metro.config.js - Optimize bundle size
module.exports = {
  transformer: {
    minifierConfig: {
      mangle: {
        keep_fnames: true,
      },
    },
  },
};
```

### Security Considerations
```typescript
// Avoid logging sensitive information in production
const isDevelopment = __DEV__;

const log = (message: string, data?: any) => {
  if (isDevelopment) {
    console.log(message, data);
  }
};

// Validate all user inputs
const validateInput = (input: string): boolean => {
  // Implement proper validation
  return input.length > 0 && input.length < 1000;
};

// Use secure communication
const apiCall = async (url: string) => {
  if (!url.startsWith('https://')) {
    throw new Error('Only HTTPS URLs are allowed');
  }
  
  return fetch(url);
};
```

## Debugging Mobile Apps

### React Native Debugger
```bash
# Install React Native Debugger
# Enable remote debugging in app
# Use Redux DevTools for state inspection
```

### Device Debugging
```typescript
// Use Flipper for advanced debugging
import {logger} from 'flipper';

// Log network requests
fetch(url).then(response => {
  logger.info('API Response', {url, status: response.status});
});

// Use console statements strategically
console.log('Component rendered with props:', props);

// Remote debugging
// Shake device or press Cmd+D (iOS) / Cmd+M (Android) to open debug menu
```

### Common Mobile Issues
1. **Memory leaks** - Monitor with profiling tools
2. **Network timeouts** - Implement proper timeout handling
3. **Platform differences** - Test thoroughly on both platforms
4. **Performance bottlenecks** - Use performance monitoring tools
5. **Battery drain** - Monitor background processes and animations

Remember: Mobile development requires constant attention to user experience, performance, and platform-specific behaviors. Always test on real devices and consider the unique constraints of mobile environments.