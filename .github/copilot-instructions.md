# GitHub Copilot Instructions for All About Olaf (AAO-React-Native)

## Project Overview

All About Olaf is a React Native mobile application for the St. Olaf College community. This cross-platform app provides students, faculty, and staff with access to campus information, dining menus, course catalogs, campus maps, and more.

**Key Technologies:**
- React Native 0.72.9 with TypeScript
- Cross-platform mobile development (iOS/Android)
- React Navigation for navigation
- Redux Toolkit for state management
- React Query for data fetching
- Jest for testing
- Fastlane for CI/CD

## Code Style and Standards

### TypeScript
- Use TypeScript for all new code
- Prefer explicit typing over `any`
- Use interfaces for object shapes and component props
- Follow existing naming conventions for types (e.g., `JobType`, `DirectorySearchTypeEnum`)

### React Native Patterns
- Use functional components with hooks
- Follow React hooks rules (use ESLint rules-of-hooks)
- Prefer `StyleSheet.create()` for styles
- Use platform-specific code when necessary with `.ios.tsx` and `.android.tsx` extensions
- Import React Native components explicitly: `import {View, Text} from 'react-native'`

### Code Organization
- Follow the existing modular structure in `source/`
- Group related components in feature directories (e.g., `views/dining/`, `views/directory/`)
- Use barrel exports (`index.ts`) for clean imports
- Keep components focused and single-responsibility

### State Management
- Use Redux Toolkit for global state
- Use React Query for server state and caching
- Prefer local state (useState) for component-specific state
- Use React Context sparingly, mainly for theme/settings

### Naming Conventions
- Components: PascalCase (e.g., `StudentWorkView`)
- Files: kebab-case for most files, PascalCase for React components
- Variables/functions: camelCase
- Constants: UPPER_SNAKE_CASE
- Types/Interfaces: PascalCase with descriptive suffixes (e.g., `Type`, `Props`)

### Imports
- Group imports: React, React Native, third-party, local
- Use absolute imports from `source/` root when helpful
- Prefer named imports over default imports for clarity

## Mobile Development Best Practices

### Performance
- Use `FlatList` or `VirtualizedList` for long lists
- Implement proper image loading with placeholders
- Use `useCallback` and `useMemo` judiciously for expensive operations
- Avoid inline functions in render methods for better performance

### Platform Considerations
- Test on both iOS and Android
- Use platform-specific styles when needed: `Platform.select()`
- Consider platform-specific UI patterns (iOS TableView vs Android Material Design)
- Handle safe areas properly with `react-native-safe-area-context`

### Data Handling
- Use React Query for API calls with proper error handling
- Implement offline support where appropriate
- Cache data appropriately for mobile users
- Handle network connectivity changes

### Navigation
- Use React Navigation v6 patterns
- Implement proper deep linking
- Handle navigation state persistence
- Use typed navigation (see `navigation/types.ts`)

## Testing Guidelines

### Unit Testing
- Write tests for utility functions and complex logic
- Test React components with React Native Testing Library
- Mock external dependencies and API calls
- Follow existing test patterns in the codebase

### Test Structure
- Place tests adjacent to source files or in `__tests__` directories
- Use descriptive test names that explain the behavior
- Group related tests with `describe` blocks
- Use `beforeEach`/`afterEach` for test setup/cleanup

## Security Considerations

### Mobile Security
- Never commit sensitive data (API keys, credentials)
- Use secure storage (React Native Keychain) for sensitive data
- Validate all user inputs
- Use secure communication (HTTPS only)
- Handle deep links securely

### Data Privacy
- Minimize data collection
- Handle personal information according to privacy policies
- Implement proper data encryption for sensitive information

## Common Patterns in This Codebase

### Email/Contact Integration
- Use `sendEmail` component for email functionality
- Use `callPhone` for phone number interactions
- Include fallback UI for devices without email/phone capabilities

### Error Handling
- Implement user-friendly error messages
- Use React Error Boundaries for component error handling
- Log errors appropriately (using Sentry integration)

### Data Formatting
- **Do not use Moment.js for new code; it is deprecated.** Use modern alternatives such as `date-fns` or `Day.js` for date/time formatting.
- Use utility functions for consistent data formatting
- Handle edge cases in data parsing

### Styling
- Use the existing color system from `@frogpond/colors`
- Follow existing spacing and typography patterns
- Ensure accessibility with proper contrast and font sizes
- Support both light and dark themes

## Development Workflow

### Before Writing Code
1. Check existing patterns in the codebase
2. Consider mobile-specific constraints (network, performance, battery)
3. Plan for both iOS and Android platforms
4. Consider offline scenarios

### Code Quality
- Run ESLint before committing: `npm run lint`
- Format code with Prettier: `npm run pretty`
- Write meaningful commit messages
- Keep changes focused and atomic

### Architecture Decisions
- Follow existing component composition patterns
- Use the established directory structure
- Leverage existing utility functions and components
- Consider reusability across different screens

## Helpful Resources

### React Native
- React Native Documentation: https://reactnative.dev/
- React Navigation: https://reactnavigation.org/
- Platform-specific considerations

### State Management
- Redux Toolkit: https://redux-toolkit.js.org/
- React Query: https://tanstack.com/query/

### Testing
- React Native Testing Library: https://callstack.github.io/react-native-testing-library/
- Jest Documentation: https://jestjs.io/

## Code Review Considerations

When reviewing code in this project:
- Ensure cross-platform compatibility
- Check for memory leaks in list components
- Verify proper error handling
- Confirm accessibility compliance
- Test on multiple screen sizes
- Validate navigation flows
- Check for proper loading states

## Performance Monitoring

- Use performance profiling tools
- Monitor app bundle size
- Track memory usage patterns
- Optimize image loading and caching
- Monitor network request efficiency

Remember: This is a mobile app serving a college community. Prioritize reliability, performance, and user experience across different devices and network conditions.