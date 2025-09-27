# Learning Resources for All About Olaf Development

## Project-Specific Resources

### Codebase Documentation
- [Contributing Guidelines](../CONTRIBUTING.md) - Read this first for contribution workflow
- [Code of Conduct](../CODE_OF_CONDUCT.md) - Community standards and expectations
- [Security Policy](../SECURITY.md) - Reporting security issues

### Project Architecture
Study these key directories to understand the app structure:
- `source/views/` - Main application screens and features
- `source/components/` - Reusable UI components
- `source/lib/` - Utility functions and shared logic
- `source/navigation/` - Navigation configuration and types
- `modules/` - Internal packages and shared modules

### Key Files to Understand
- `source/app.tsx` - Main application component
- `source/root.ts` - App initialization and setup
- `package.json` - Dependencies and scripts
- `tsconfig.json` - TypeScript configuration
- `.eslintrc.yaml` - Code style rules

## React Native Learning Path

### Fundamentals
1. **React Native Basics**
   - [React Native Tutorial](https://reactnative.dev/docs/tutorial)
   - [Core Components](https://reactnative.dev/docs/components-and-apis)
   - [Handling Text Input](https://reactnative.dev/docs/handling-text-input)
   - [Using a ScrollView](https://reactnative.dev/docs/using-a-scrollview)
   - [Using List Views](https://reactnative.dev/docs/using-a-listview)

2. **Navigation**
   - [React Navigation v6](https://reactnavigation.org/docs/getting-started)
   - [Stack Navigator](https://reactnavigation.org/docs/stack-navigator)
   - [Tab Navigator](https://reactnavigation.org/docs/bottom-tab-navigator)
   - [Deep Linking](https://reactnavigation.org/docs/deep-linking)

3. **Platform Differences**
   - [Platform Specific Code](https://reactnative.dev/docs/platform-specific-code)
   - [iOS vs Android Design Guidelines](https://reactnative.dev/docs/platform-specific-code#platform-module)

### Advanced Topics
1. **Performance**
   - [Performance Overview](https://reactnative.dev/docs/performance)
   - [Optimizing Flatlist](https://reactnative.dev/docs/optimizing-flatlist-configuration)
   - [RAM Bundles](https://reactnative.dev/docs/ram-bundles-inline-requires)

2. **State Management**
   - [Redux Toolkit](https://redux-toolkit.js.org/tutorials/quick-start)
   - [React Query](https://tanstack.com/query/v4/docs/react/overview)
   - [Context API](https://reactjs.org/docs/context.html)

## TypeScript for React Native

### Learning Resources
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [TypeScript with React Native](https://reactnative.dev/docs/typescript)

### Key Concepts to Master
- Interface definitions for props
- Generic types for reusable components
- Type guards for runtime type checking
- Union types for component variants
- Mapped types for state management

## Testing in React Native

### Testing Libraries
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Native Testing Library](https://callstack.github.io/react-native-testing-library/)
- [Testing React Navigation](https://reactnavigation.org/docs/testing/)

### Testing Patterns
- Component testing with RNTL
- Hook testing with `@testing-library/react-hooks`
- Mocking native modules
- Snapshot testing best practices
- Integration testing strategies

## Mobile Development Concepts

### UI/UX Design
- [Apple Human Interface Guidelines](https://developer.apple.com/design/human-interface-guidelines/)
- [Material Design Guidelines](https://material.io/design)
- [Mobile App Design Best Practices](https://www.interaction-design.org/literature/article/mobile-app-design-principles)

### Performance Considerations
- Understanding the React Native bridge
- Memory management in mobile apps
- Battery optimization techniques
- Network efficiency patterns
- Image optimization strategies

### Platform-Specific Development
- iOS development concepts (for understanding iOS-specific code)
- Android development concepts (for understanding Android-specific code)
- Native module integration
- Platform-specific UI components

## Tools and Development Environment

### Development Setup
- [React Native Environment Setup](https://reactnative.dev/docs/environment-setup)
- [iOS Development Setup](https://reactnative.dev/docs/running-on-device)
- [Android Development Setup](https://reactnative.dev/docs/running-on-device)

### Debugging Tools
- [React Native Debugger](https://github.com/jhen0409/react-native-debugger)
- [Flipper](https://fbflipper.com/)
- [Chrome DevTools](https://reactnative.dev/docs/debugging)

### Build and Deployment
- [Fastlane Documentation](https://docs.fastlane.tools/)
- [App Store Deployment](https://reactnative.dev/docs/publishing-to-app-store)
- [Google Play Deployment](https://reactnative.dev/docs/signed-apk-android)

## Libraries Used in This Project

### UI and Navigation
- [React Navigation v6](https://reactnavigation.org/)
- [React Native Paper](https://callstack.github.io/react-native-paper/)
- [React Native Vector Icons](https://github.com/oblador/react-native-vector-icons)
- [React Native Safe Area Context](https://github.com/th3rdwave/react-native-safe-area-context)

### State Management and Data
- [Redux Toolkit](https://redux-toolkit.js.org/)
- [React Query](https://tanstack.com/query/)
- [Redux Persist](https://github.com/rt2zz/redux-persist)
- [AsyncStorage](https://react-native-async-storage.github.io/async-storage/)

### Utilities
- [Moment.js](https://momentjs.com/) (consider migrating to date-fns)
- [Lodash](https://lodash.com/)
- [React Native Device Info](https://github.com/react-native-device-info/react-native-device-info)
- [React Native Keychain](https://github.com/oblador/react-native-keychain)

## College App Development Context

### Understanding the Domain
- College campus app requirements
- Student lifecycle and needs
- Academic calendar integration
- Campus services integration
- Dining and facilities management

### St. Olaf Specific
- Understanding the St. Olaf community
- Campus culture and traditions
- Academic programs and structure
- Campus facilities and services

## Best Practices and Patterns

### Code Quality
- [Clean Code principles](https://clean-code-javascript.com/)
- [React/React Native Best Practices](https://react.dev/learn/thinking-in-react)
- [TypeScript Best Practices](https://typescript-eslint.io/rules/)

### Mobile App Architecture
- [Clean Architecture for Mobile](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Component composition patterns](https://reactjs.org/docs/components-and-props.html)
- [State management patterns](https://redux.js.org/style-guide/style-guide)

### Performance and Optimization
- [React Performance](https://react.dev/learn/render-and-commit)
- [Mobile Performance Best Practices](https://web.dev/mobile/)
- [React Native Performance](https://reactnative.dev/docs/performance)

## Continuous Learning

### Stay Updated
- [React Native Blog](https://reactnative.dev/blog)
- [React Blog](https://react.dev/blog)
- [TypeScript Blog](https://devblogs.microsoft.com/typescript/)

### Community Resources
- [React Native Community](https://github.com/react-native-community)
- [Awesome React Native](https://github.com/jondot/awesome-react-native)
- [React Native Elements](https://react-native-elements.github.io/react-native-elements/)

### Practice and Examples
- Study the existing codebase patterns
- Contribute to open source React Native projects
- Build small demo apps to practice concepts
- Participate in React Native community discussions

Remember: The best way to learn is by doing. Start by making small contributions to this codebase and gradually take on more complex features as you become familiar with the patterns and architecture.