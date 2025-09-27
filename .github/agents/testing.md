# Testing Guidelines for AI Agents

## Testing Philosophy

All changes should be thoroughly tested to ensure reliability and maintainability of the All About Olaf mobile app. This includes unit tests, integration tests, and manual testing on both iOS and Android platforms.

## Test Setup and Configuration

### Running Tests
```bash
# Run all tests
npm test

# Run tests in watch mode
npm test -- --watch

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- StudentWorkView.test.tsx
```

### Test Environment
- Jest is configured for testing
- React Native Testing Library for component testing
- Mocks are set up for React Native modules in `source/__mocks__/`

## Testing Strategies

### 1. Unit Testing

#### What to Test
- Utility functions and helpers
- Component logic and state changes
- Data transformation functions
- Validation functions
- Pure functions and calculations

#### Example Unit Test Pattern
```typescript
import {formatStudentJob} from '../utils/format-job';
import type {JobType} from '../types';

describe('formatStudentJob', () => {
  it('should format job title correctly', () => {
    const job: JobType = {
      title: 'student worker',
      // ... other properties
    };
    
    const result = formatStudentJob(job);
    expect(result.title).toBe('Student Worker');
  });

  it('should handle missing data gracefully', () => {
    const job: JobType = {
      title: '',
      // ... other properties
    };
    
    const result = formatStudentJob(job);
    expect(result.title).toBe('Untitled Position');
  });
});
```

### 2. Component Testing

#### What to Test
- Component rendering with different props
- User interactions (taps, swipes, text input)
- Conditional rendering based on state/props
- Accessibility features
- Navigation behavior

#### Example Component Test Pattern
```typescript
import React from 'react';
import {render, fireEvent, waitFor} from '@testing-library/react-native';
import {StudentJobCard} from '../student-job-card';
import type {JobType} from '../types';

const mockJob: JobType = {
  id: '1',
  title: 'Campus Tour Guide',
  office: 'Admissions',
  // ... other properties
};

describe('StudentJobCard', () => {
  it('renders job information correctly', () => {
    const {getByText} = render(<StudentJobCard job={mockJob} />);
    
    expect(getByText('Campus Tour Guide')).toBeTruthy();
    expect(getByText('Admissions')).toBeTruthy();
  });

  it('handles tap to view details', () => {
    const mockOnPress = jest.fn();
    const {getByTestId} = render(
      <StudentJobCard job={mockJob} onPress={mockOnPress} />
    );
    
    fireEvent.press(getByTestId('job-card'));
    expect(mockOnPress).toHaveBeenCalledWith(mockJob);
  });

  it('shows loading state when data is loading', () => {
    const {getByTestId} = render(
      <StudentJobCard job={mockJob} isLoading={true} />
    );
    
    expect(getByTestId('loading-indicator')).toBeTruthy();
  });
});
```

### 3. Hook Testing

#### Testing Custom Hooks
```typescript
import {renderHook, act} from '@testing-library/react-hooks';
import {useStudentJobs} from '../hooks/use-student-jobs';

describe('useStudentJobs', () => {
  it('should fetch jobs successfully', async () => {
    const {result} = renderHook(() => useStudentJobs());
    
    await waitFor(() => {
      expect(result.current.isLoading).toBe(false);
    });
    
    expect(result.current.jobs).toHaveLength(5);
    expect(result.current.error).toBeNull();
  });

  it('should handle refresh action', async () => {
    const {result} = renderHook(() => useStudentJobs());
    
    act(() => {
      result.current.refresh();
    });
    
    expect(result.current.isRefreshing).toBe(true);
  });
});
```

### 4. Navigation Testing

#### Testing Navigation Flows
```typescript
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {render, fireEvent} from '@testing-library/react-native';
import {StudentWorkView} from '../student-work-view';

const Stack = createNativeStackNavigator();

const renderWithNavigation = (component: React.ReactElement) => {
  return render(
    <NavigationContainer>
      <Stack.Navigator>
        <Stack.Screen name="Test" component={() => component} />
      </Stack.Navigator>
    </NavigationContainer>
  );
};

describe('StudentWorkView Navigation', () => {
  it('navigates to job detail on job selection', () => {
    const {getByTestId} = renderWithNavigation(<StudentWorkView />);
    
    fireEvent.press(getByTestId('job-item-1'));
    // Test navigation occurred
  });
});
```

### 5. API and Data Testing

#### Mocking API Calls
```typescript
// Mock the API module
jest.mock('../api/student-jobs', () => ({
  fetchStudentJobs: jest.fn(),
}));

import {fetchStudentJobs} from '../api/student-jobs';
const mockFetchStudentJobs = fetchStudentJobs as jest.MockedFunction<typeof fetchStudentJobs>;

describe('Student Jobs API', () => {
  beforeEach(() => {
    mockFetchStudentJobs.mockClear();
  });

  it('should handle successful API response', async () => {
    const mockJobs = [
      {id: '1', title: 'Job 1'},
      {id: '2', title: 'Job 2'},
    ];
    
    mockFetchStudentJobs.mockResolvedValue(mockJobs);
    
    const result = await fetchStudentJobs();
    expect(result).toEqual(mockJobs);
  });

  it('should handle API errors gracefully', async () => {
    mockFetchStudentJobs.mockRejectedValue(new Error('Network error'));
    
    await expect(fetchStudentJobs()).rejects.toThrow('Network error');
  });
});
```

## Testing Best Practices

### 1. Test Structure
- Use descriptive test names that explain the behavior
- Group related tests with `describe` blocks
- Use `beforeEach`/`afterEach` for setup and cleanup
- Keep tests focused and independent

### 2. Mock Strategy
- Mock external dependencies (APIs, native modules)
- Use real implementations for internal utilities when possible
- Keep mocks simple and focused
- Reset mocks between tests

### 3. Accessibility Testing
```typescript
import {render} from '@testing-library/react-native';
import {StudentJobCard} from '../student-job-card';

describe('StudentJobCard Accessibility', () => {
  it('has proper accessibility labels', () => {
    const {getByA11yLabel} = render(<StudentJobCard job={mockJob} />);
    
    expect(getByA11yLabel('View job details for Campus Tour Guide')).toBeTruthy();
  });

  it('supports accessibility actions', () => {
    const {getByA11yRole} = render(<StudentJobCard job={mockJob} />);
    
    expect(getByA11yRole('button')).toBeTruthy();
  });
});
```

### 4. Performance Testing Considerations
- Test that lists render efficiently with many items
- Verify that expensive operations are properly memoized
- Check that components unmount cleanly
- Test memory usage patterns where applicable

## Mock Setup

### Common Mocks
Create mocks for frequently used modules:

#### React Native Mocks
```typescript
// __mocks__/react-native.js
export * from 'react-native';

export const Platform = {
  OS: 'ios',
  select: jest.fn((options) => options.ios),
};

export const Dimensions = {
  get: jest.fn(() => ({width: 375, height: 812})),
};
```

#### Navigation Mocks
```typescript
// __mocks__/@react-navigation/native.js
export const useNavigation = () => ({
  navigate: jest.fn(),
  goBack: jest.fn(),
  push: jest.fn(),
});

export const useRoute = () => ({
  params: {},
});
```

#### AsyncStorage Mock
```typescript
// __mocks__/@react-native-async-storage/async-storage.js
export default {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
```

## Integration Testing

### Testing User Flows
1. **Complete Navigation Flows**
   - Test navigation from main menu to detail screens
   - Verify deep linking works correctly
   - Test back navigation behavior

2. **Data Flow Testing**
   - Test loading states during API calls
   - Verify error handling displays properly
   - Test offline/online state transitions

3. **Cross-Platform Testing**
   - Test on both iOS and Android simulators
   - Verify platform-specific behaviors
   - Test different screen sizes and orientations

## Manual Testing Checklist

When making changes, manually test:

### 1. Core Functionality
- [ ] App launches successfully
- [ ] Navigation works on all screens
- [ ] Data loads correctly
- [ ] User interactions respond properly

### 2. Platform-Specific
- [ ] iOS: Test on iPhone and iPad
- [ ] Android: Test on phone and tablet
- [ ] Test both orientations where applicable
- [ ] Verify platform-specific UI patterns

### 3. Edge Cases
- [ ] Poor network conditions
- [ ] App backgrounding/foregrounding
- [ ] Low memory conditions
- [ ] Accessibility features enabled

### 4. Performance
- [ ] Smooth scrolling in lists
- [ ] Fast navigation transitions
- [ ] Reasonable app startup time
- [ ] No memory leaks during extended use

## Continuous Integration

### Pre-commit Testing
```bash
# Run before committing changes
npm run lint
npm test
npm run type-check
```

### CI Pipeline Testing
The GitHub Actions workflow automatically runs:
- Linting checks
- Type checking
- Unit and integration tests
- Build verification for both platforms

## Test-Driven Development

When adding new features:

1. **Write Tests First**
   - Define expected behavior
   - Write failing tests
   - Implement feature to make tests pass

2. **Red-Green-Refactor Cycle**
   - Red: Write failing test
   - Green: Make test pass with minimal code
   - Refactor: Improve code while keeping tests passing

3. **Test Coverage Goals**
   - Aim for high coverage of critical paths
   - Focus on business logic and user interactions
   - Don't aim for 100% coverage at expense of test quality

## Debugging Tests

### Common Issues
1. **Async timing issues** - Use `waitFor` and proper async/await
2. **Mock setup problems** - Verify mocks are reset between tests
3. **Component rendering issues** - Check that required providers are wrapped
4. **Platform-specific test failures** - Use platform-specific mocks

### Debugging Tools
```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test with debugging
npm test -- --debug StudentWorkView.test.tsx

# Run tests with coverage report
npm test -- --coverage --coverageReporters=html
```

Remember: Good tests are an investment in code quality and developer confidence. They should be readable, maintainable, and provide clear feedback when something breaks.