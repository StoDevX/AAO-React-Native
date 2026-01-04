# Add Screen Skill

This skill helps you add new screens to the All About Olaf React Native application following established patterns and best practices.

## Quick Start

1. **Scaffold the basic files:**
   ```bash
   python .github/skills/add-screen/scripts/scaffold_screen.py my_new_screen "My New Screen"
   ```

2. **Follow the checklist** in `references/checklist.md` to complete the integration

3. **Use the template** in `references/screen-template.md` as a guide for implementation

## What This Skill Provides

- **SKILL.md**: Comprehensive guide for adding screens
- **Screen Template**: Starting template for new components
- **Checklist**: Step-by-step validation checklist
- **Scaffold Script**: Automated file creation script

## Manual Process

If you prefer to do it manually, follow these steps:

1. Create the view directory: `source/views/[screen-name]/`
2. Create `index.tsx` with the component following the template
3. Update `source/navigation/types.tsx` to add the screen type
4. Update `source/navigation/routes.tsx` to add the route
5. Update `source/views/views.ts` if it should appear on home screen
6. Test thoroughly

## Examples

See existing screens in `source/views/` for reference:
- `home/` - Main navigation screen
- `menus/` - Screen with complex navigation
- `settings/` - Multi-screen section

## Need Help?

- Check the SKILL.md for detailed instructions
- Use the checklist to ensure completeness
- Look at existing screens for patterns
- Test frequently during development