# Fishing Log App

## Overview

Fishing Log is a React Native mobile application built with Expo that allows users to log and track their fishing catches. The app is designed as a single-user, offline-first application with local SQLite storage, featuring multi-language support (English/Spanish), customizable user profiles, and data export capabilities. The app uses a tab-based navigation structure with a floating action button for quick catch logging.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React Native with Expo SDK 54
- **Navigation**: React Navigation v7 with bottom tabs and native stack navigators
- **UI Components**: Custom themed components with light/dark mode support
- **Animations**: React Native Reanimated for smooth, native-feeling interactions
- **Styling**: StyleSheet-based approach with centralized theme constants
- **State Management**: React Context API for global state (language, settings, theme)

**Key Design Patterns**:
- Custom hooks for cross-cutting concerns (theme, language, settings, screen insets)
- Context providers for global state management without prop drilling
- Themed component wrappers (ThemedText, ThemedView) for consistent styling
- Error boundaries for graceful error handling
- Keyboard-aware scroll views for form inputs

**Navigation Structure**:
- Root: Bottom tab navigator with 4 tabs (Catches, Stats, Export, Profile)
- Catches tab uses a nested stack navigator for modal screens
- Floating Action Button (FAB) overlay for quick catch logging
- Platform-specific blur effects on iOS tab bar

### Data Layer

**Local Storage Solutions**:
- **SQLite Database** (via expo-sqlite): Primary data storage for fishing catches
  - Tables: `catches` with indices on dateTime and species
  - WAL mode enabled for better concurrency
  - Schema includes: species, weight, location (lat/long + name), photos, weather, notes, timestamps
- **AsyncStorage**: Persistent storage for user preferences (language, settings, avatar, units)

**Data Access Pattern**:
- Database initialization on app start
- Helper functions for CRUD operations (getAllCatches, getCatchById, addCatch, updateCatch, deleteCatch)
- Statistics aggregation functions for the Stats screen
- Date-range filtering for export functionality

### Cross-Platform Considerations

**Platform-Specific Features**:
- iOS: Blur effects for navigation headers and tab bar
- Android: Solid backgrounds with edge-to-edge display
- Web: Fallback components where native APIs aren't available (KeyboardAwareScrollView)

**Permissions Handling**:
- Camera access for catch photos
- Photo library access
- Location services (when-in-use) for catch locations
- Platform-specific permission request flows

### State Management

**Global State**:
- **LanguageContext**: Current language (en/es) and translation function
- **SettingsContext**: User profile (display name, avatar, units, pro status)
- **Theme**: Derived from device color scheme, not persisted

**Local State**:
- Component-level useState for UI interactions
- useFocusEffect for screen-level data refresh on navigation

### Internationalization

**Implementation**:
- Translation keys stored in constants/i18n.ts
- Language detection from device locale on first launch
- User-selectable language toggle (EN/ES)
- All user-facing strings use translation function `t`

### Asset Management

**Image Handling**:
- expo-image for optimized image rendering
- Local storage of catch photos via expo-image-picker
- Preset avatar images (3 fishing-themed silhouettes)
- App icons and splash screens for iOS/Android/Web

### Feature Set

**Core Features**:
1. **Catch Logging**: Species, weight, location, photo, date/time, bait, weather, notes
2. **Catch Browsing**: List view with search/filter, pull-to-refresh
3. **Statistics**: Total catches, biggest catch, top species
4. **Data Export**: CSV/JSON formats with date range filtering
5. **Profile Management**: Customizable avatar, display name, unit preferences

**Pro Features** (placeholder implementation):
- Advanced statistics
- Cloud backup
- Ad removal
- Premium export formats

## External Dependencies

### Core Expo Modules
- **expo**: Main Expo framework (v54.0.23)
- **expo-sqlite**: SQLite database for local data persistence
- **expo-image**: Optimized image component
- **expo-image-picker**: Camera and photo library access
- **expo-location**: GPS location services
- **expo-file-system**: File operations for data export
- **expo-sharing**: Native sharing dialogs for export
- **expo-localization**: Device locale detection
- **expo-blur**: iOS blur effects for navigation
- **expo-haptics**: Tactile feedback

### Navigation
- **@react-navigation/native**: Core navigation library
- **@react-navigation/bottom-tabs**: Tab-based navigation
- **@react-navigation/native-stack**: Stack navigation for modals
- **react-native-screens**: Native screen optimization
- **react-native-safe-area-context**: Safe area handling

### UI/UX Libraries
- **react-native-reanimated**: Native-driven animations
- **react-native-gesture-handler**: Touch gesture handling
- **react-native-keyboard-controller**: Keyboard behavior management
- **@expo/vector-icons**: Icon library (Feather icons)

### Storage
- **@react-native-async-storage/async-storage**: Key-value persistent storage

### Development Tools
- **TypeScript**: Type safety
- **Babel**: Module resolver for `@/` path aliases
- **ESLint + Prettier**: Code quality and formatting

### Third-Party Services
- No cloud services or external APIs currently integrated
- Offline-first architecture with all data stored locally
- Export functionality uses native platform sharing (no external upload)