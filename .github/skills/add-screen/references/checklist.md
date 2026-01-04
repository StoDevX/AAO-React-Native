# Add Screen Checklist

Use this checklist to ensure you've completed all necessary steps when adding a new screen.

## ✅ Component Creation
- [ ] Created `source/views/[screen-name]/` directory
- [ ] Created `index.tsx` with main component
- [ ] Exported `View`, `NavigationKey`, `NavigationOptions`, `NavigationParams`
- [ ] Component follows React Native and project patterns
- [ ] Added proper TypeScript types
- [ ] Created additional component files if needed
- [ ] Added `types.ts` file if screen has complex types

## ✅ Navigation Setup
- [ ] Added import to `source/navigation/types.tsx`
- [ ] Added screen to appropriate ParamList in `types.tsx`
- [ ] Added import to `source/navigation/routes.tsx`
- [ ] Added `Stack.Screen` to appropriate navigator in `routes.tsx`
- [ ] Verified NavigationKey matches between files

## ✅ Home Screen Integration (if applicable)
- [ ] Added NavigationKey import to `source/views/views.ts`
- [ ] Added entry to `AllViews()` array
- [ ] Chose appropriate icon from available icons
- [ ] Selected appropriate color from `@frogpond/colors`
- [ ] Set correct foreground (light/dark) for icon contrast

## ✅ Testing & Validation
- [ ] App builds without TypeScript errors
- [ ] Screen appears in home menu (if added)
- [ ] Navigation to screen works correctly
- [ ] Back navigation works properly
- [ ] Screen displays correctly on iOS and Android
- [ ] No linting errors
- [ ] Follows accessibility guidelines

## ✅ Code Quality
- [ ] Component is focused and single-responsibility
- [ ] Uses proper hooks and state management
- [ ] Follows existing styling patterns
- [ ] Includes proper error handling
- [ ] Has appropriate loading states
- [ ] Includes meaningful comments for complex logic

## Common Issues to Check

### Navigation Issues
- NavigationKey string matches exactly across all files
- ParamList type matches NavigationParams export
- Screen is added to correct navigator (Root vs Settings vs Component Library)

### TypeScript Issues
- All imports are correct and exist
- Navigation parameter types match usage
- Component props are properly typed

### Display Issues
- Screen title is user-friendly
- Back button text is appropriate
- Colors and icons follow design system
- Layout works on different screen sizes

### Integration Issues
- Screen follows established patterns
- No conflicts with existing screens
- Proper cleanup on unmount (if needed)
- Memory leaks avoided