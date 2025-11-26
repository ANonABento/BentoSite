# Dimension UI Refactoring Plan

## Current State
- **File**: `Dimension.ui.tsx` (960+ lines)
- **Components**: 9 major components in single file
- **Issues**: Difficult to maintain, large file size, mixed concerns

## New Structure

```
src/components/Dimension/ui/
├── index.ts                    # Main exports
├── shared/                     # Shared components and constants
│   ├── design-system.ts        # DESIGN_SYSTEM constant
│   ├── base-components.ts      # Basic reusable components
│   └── index.ts                # Shared exports
├── widgets/                    # Draggable, collapsible widgets
│   ├── collapsible-widget.tsx
│   ├── model-info-display.tsx
│   ├── control-panel.tsx
│   ├── camera-presets-widget.tsx
│   └── index.ts                # Widgets exports
├── modals/                     # Modal dialogs
│   ├── model-selector.tsx
│   ├── keyboard-shortcuts-help.tsx
│   └── index.ts                # Modals exports
├── feedback/                   # Loading, error, and feedback components
│   ├── loading-spinner.tsx
│   ├── loading-progress.tsx
│   ├── error-message.tsx
│   └── index.ts                # Feedback exports
└── components.tsx              # Re-export all components
```

## Component Extraction Strategy

### 1. Shared Components (Most Important)
- Extract DESIGN_SYSTEM constant
- Extract utility functions
- Create base component structure

### 2. Widget Components
- CollapsibleWidget (base widget)
- ModelInfoDisplay (uses CollapsibleWidget)
- ControlPanel (uses CollapsibleWidget)
- CameraPresetsWidget (standalone widget)

### 3. Modal Components
- ModelSelector (full-screen modal)
- KeyboardShortcutsHelp (overlay modal)

### 4. Feedback Components
- LoadingSpinner
- LoadingProgress
- ErrorMessage

## Benefits
- **Maintainability**: Each component in its own file
- **Reusability**: Shared components can be used across projects
- **Testability**: Easier to test individual components
- **Team Collaboration**: Multiple developers can work on different components
- **Scalability**: Easy to add new components

## Migration Steps
1. Create new directory structure
2. Extract shared components and constants
3. Extract each major component into individual files
4. Update imports/exports
5. Update main component to use new structure
6. Test all functionality
7. Remove old Dimension.ui.tsx file