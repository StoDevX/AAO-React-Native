# Development Workflow for AI Agents

## Pre-Development Checklist

Before making any code changes:

1. **Environment Setup**
   ```bash
   npm ci                    # Install dependencies
   npm run lint             # Check code quality
   npm run test             # Run existing tests
   ```

2. **Understand the Change**
   - Read the issue/PR description carefully
   - Identify which platforms are affected (iOS/Android/both)
   - Check if the change affects critical user flows
   - Review related components and dependencies

3. **Analyze Impact**
   - Check for breaking changes
   - Identify affected components
   - Consider performance implications
   - Plan testing strategy

## Development Process

### Code Changes
1. **Follow Existing Patterns**
   - Study similar implementations in the codebase
   - Use existing utility functions and components
   - Follow the established file structure

2. **TypeScript Best Practices**
   - Add proper type definitions
   - Use existing types when possible
   - Avoid `any` types
   - Export types that might be reused

3. **React Native Considerations**
   - Test on both iOS and Android if applicable
   - Consider different screen sizes
   - Handle loading and error states
   - Implement proper accessibility

### Testing Strategy
1. **Unit Tests**
   - Test utility functions
   - Test component logic
   - Mock external dependencies
   - Use existing test patterns

2. **Integration Testing**
   - Test navigation flows
   - Test data fetching
   - Test user interactions

### Code Quality
1. **Linting and Formatting**
   ```bash
   npm run lint             # Check for issues
   npm run pretty          # Format code
   ```

2. **Type Checking**
   ```bash
   npx tsc --noEmit        # Type check without compilation
   ```

## Common Development Tasks

### Adding a New Screen
1. Create component in appropriate `views/` subdirectory
2. Add navigation types to `navigation/types.ts`
3. Configure navigation in relevant navigator
4. Add any required permissions or native modules
5. Test on both platforms

### Adding a New Component
1. Place in `components/` for shared components
2. Export from appropriate index file
3. Add TypeScript props interface
4. Include proper styling with `StyleSheet.create()`
5. Add accessibility props

### API Integration
1. Use React Query for data fetching
2. Add proper error handling
3. Implement loading states
4. Consider offline scenarios
5. Add TypeScript types for API responses

### State Management
1. Use local state (useState) for component-specific data
2. Use React Query for server state
3. Use Redux for global app state
4. Consider performance implications

## File Organization

### Directory Structure
```
source/
├── components/          # Reusable UI components
├── views/              # Screen components organized by feature
│   ├── dining/         # Dining-related screens
│   ├── directory/      # Directory search screens
│   ├── calendar/       # Calendar and events
│   └── ...
├── lib/               # Utility functions and shared logic
├── navigation/        # Navigation configuration
└── redux/            # Global state management
```

### Naming Conventions
- Components: `PascalCase` (e.g., `StudentWorkView`)
- Files: `kebab-case` (e.g., `student-work-view.tsx`)
- Directories: `kebab-case`
- Constants: `UPPER_SNAKE_CASE`

## Platform-Specific Considerations

### iOS Specific
- Use `.ios.tsx` extension for iOS-only components
- Consider iOS design patterns (navigation bars, tab bars)
- Handle safe area insets properly
- Test on various iPhone screen sizes

### Android Specific
- Use `.android.tsx` extension for Android-only components
- Follow Material Design guidelines
- Handle Android back button
- Test on various Android screen sizes and versions

### Cross-Platform
- Use `Platform.select()` for platform-specific styles
- Test thoroughly on both platforms
- Consider platform-specific user expectations

## Common Patterns in This Codebase

### Data Fetching
```typescript
// Use React Query for API calls
const {data, isLoading, error} = useQuery({
  queryKey: ['key'],
  queryFn: fetchFunction,
});
```

### Navigation
```typescript
// Typed navigation
import {useNavigation} from '@react-navigation/native';
import type {RootStackParamList} from '../navigation/types';

const navigation = useNavigation<NavigationProp<RootStackParamList>>();
```

### Error Handling
```typescript
// Consistent error boundaries and user-friendly messages
try {
  // API call or operation
} catch (error) {
  // Log error and show user-friendly message
}
```

## Debugging and Troubleshooting

### Common Issues
1. **Metro bundler issues** - Clear cache: `npx react-native start --reset-cache`
2. **iOS build issues** - Clean and rebuild: `cd ios && xcodebuild clean`
3. **Android build issues** - Clean gradle: `cd android && ./gradlew clean`
4. **Dependency issues** - Clear node_modules and reinstall

### Debugging Tools
- React Native Debugger
- Flipper for network and Redux debugging
- Console logs (remove before production)
- React DevTools

## Performance Considerations

### Optimization Strategies
1. Use `FlatList` for long lists
2. Implement proper image loading
3. Avoid unnecessary re-renders
4. Use `useCallback` and `useMemo` judiciously
5. Optimize bundle size

### Memory Management
1. Clean up subscriptions and listeners
2. Handle component unmounting properly
3. Avoid memory leaks in async operations
4. Monitor app performance on older devices

## Security Considerations

### Mobile Security
- Never commit API keys or secrets
- Use secure storage for sensitive data
- Validate all user inputs
- Handle deep links securely
- Use HTTPS for all network requests

### Code Security
- Avoid storing sensitive data in plain text
- Use proper authentication flows
- Implement proper session management
- Consider code obfuscation for sensitive logic

## Deployment Considerations

### Build Process
- Test builds on both platforms
- Verify all assets are included
- Check bundle size and performance
- Test on physical devices

### Release Process
- Follow semantic versioning
- Update changelog
- Test on multiple devices and OS versions
- Coordinate with app store review process

## Documentation

### Code Documentation
- Add JSDoc comments for complex functions
- Document component props with TypeScript
- Include usage examples for reusable components
- Document any unusual patterns or workarounds

### Update Documentation
- Update README.md if adding new features
- Update CONTRIBUTING.md if changing development process
- Document any new dependencies or setup requirements

Remember: Mobile development requires extra attention to performance, user experience, and platform differences. Always test thoroughly on real devices when possible.