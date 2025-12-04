# Fishing Log App - Design Guidelines

## Architecture

### Authentication
No authentication required. This is a single-user, offline-first app with local SQLite storage.

**Profile/Settings Screen Required:**
- User-customizable avatar: Generate 3 fishing-themed preset avatars (angler silhouettes in different fishing poses)
- Display name field (defaults to "Angler")
- Language preference toggle (EN/ES)
- App preferences (units: metric/imperial, default weather source)

### Navigation Structure
**Root Navigation:** Tab Navigation (4 tabs + Floating Action Button)

**Tabs:**
1. **Catches** (Home) - Browse all logged catches
2. **Stats** - Statistics and insights
3. **Export** - Data export and sharing
4. **Profile** - Settings and preferences

**Floating Action Button (FAB):** 
- Positioned bottom-right, above tab bar
- Primary action: "Log New Catch"
- Always visible except during active forms

### Screen Specifications

#### 1. Catches Screen (Home)
- **Purpose:** Browse and view fishing catch history
- **Header:** 
  - Transparent background with blur effect
  - Title: "My Catches"
  - Right button: Filter/sort icon
  - Search bar (collapsible)
- **Layout:**
  - Root: FlatList (scrollable)
  - Safe area insets: top: headerHeight + Spacing.xl, bottom: tabBarHeight + Spacing.xl
  - Pull-to-refresh enabled
- **Components:**
  - Catch cards (photo thumbnail, species, weight, date)
  - Empty state with fishing rod illustration + "No catches yet" message
  - Ad banner placeholder at top (after every 5 catches when scrolling)
- **Interaction:** Tap card → Navigate to Catch Detail (modal)

#### 2. Log New Catch Screen (Modal)
- **Purpose:** One-tap quick logging interface
- **Header:**
  - Non-transparent
  - Title: "Log Catch"
  - Left button: Cancel
  - Right button: Save (disabled until required fields filled)
- **Layout:**
  - Root: ScrollView (keyboard-aware form)
  - Safe area insets: top: Spacing.xl, bottom: insets.bottom + Spacing.xl
- **Components (in order):**
  - Photo capture button (large, prominent, camera icon)
  - Species dropdown/autocomplete (required)
  - Weight input with unit toggle (required)
  - Location picker (auto-detect with map preview)
  - Date/Time picker (defaults to now)
  - Bait/Lure input (optional)
  - Weather conditions (auto-populate if available, 4 preset icons: sunny/cloudy/rainy/windy)
  - Notes textarea (optional)
- **Submit:** Right header button saves and returns to Catches screen

#### 3. Catch Detail Screen (Modal)
- **Purpose:** View full catch details
- **Header:**
  - Non-transparent
  - Left button: Back/Close
  - Right button: Edit
- **Layout:**
  - Root: ScrollView
  - Safe area insets: top: Spacing.xl, bottom: insets.bottom + Spacing.xl
- **Components:**
  - Full-size photo viewer
  - Details grid (species, weight, location map, date/time, bait, weather, notes)
  - Delete button (bottom, destructive style with confirmation alert)

#### 4. Stats Screen
- **Purpose:** View statistics and insights
- **Header:**
  - Transparent
  - Title: "Statistics"
- **Layout:**
  - Root: ScrollView
  - Safe area insets: top: headerHeight + Spacing.xl, bottom: tabBarHeight + Spacing.xl
- **Components:**
  - Summary cards (total catches, biggest catch, most caught species)
  - Charts placeholders (species distribution pie chart, catches over time line graph)
  - Ad banner placeholder (mid-scroll)
  - "Pro Upgrade" CTA card (unlock advanced stats)

#### 5. Export Screen
- **Purpose:** Export and share catch data
- **Header:**
  - Transparent
  - Title: "Export Data"
- **Layout:**
  - Root: View (non-scrollable)
  - Safe area insets: top: headerHeight + Spacing.xl, bottom: tabBarHeight + Spacing.xl
- **Components:**
  - Date range selector
  - Export format buttons (CSV, JSON - large, prominent)
  - Share button (system share sheet)
  - Pro upgrade banner (unlock automatic cloud backup)

#### 6. Profile/Settings Screen
- **Purpose:** User preferences and app settings
- **Header:**
  - Transparent
  - Title: "Profile"
- **Layout:**
  - Root: ScrollView
  - Safe area insets: top: headerHeight + Spacing.xl, bottom: tabBarHeight + Spacing.xl
- **Components:**
  - Avatar picker (3 preset avatars)
  - Display name field
  - Language toggle (EN/ES with flags)
  - Units preference (Metric/Imperial)
  - About section (app version, rate app link)
  - Pro upgrade CTA

## Design System

### Color Palette
**Primary Theme:** Ocean & Outdoors
- Primary: `#1E88E5` (Ocean Blue)
- Secondary: `#4CAF50` (Fresh Water Green)
- Accent: `#FF6F00` (Sunset Orange - for FAB and CTAs)
- Background: `#F5F7FA` (Light Gray)
- Surface: `#FFFFFF`
- Text Primary: `#1A1A1A`
- Text Secondary: `#666666`
- Border: `#E0E0E0`
- Destructive: `#E53935`
- Pro Badge: `#FFD700` (Gold)

### Typography
- **Headings:** System Bold (SF Pro/Roboto)
  - H1: 28pt
  - H2: 22pt
  - H3: 18pt
- **Body:** System Regular
  - Body: 16pt
  - Caption: 14pt
  - Small: 12pt

### Visual Design
- **Icons:** Use Feather icons from @expo/vector-icons
- **Floating Action Button:**
  - Size: 56x56pt
  - Background: Accent color (#FF6F00)
  - Icon: Plus or add icon
  - Shadow: width: 0, height: 2, opacity: 0.10, radius: 2
  - Position: 16pt from right edge, 16pt above tab bar
- **Catch Cards:**
  - Border radius: 12pt
  - Padding: 16pt
  - White background with subtle border (#E0E0E0)
  - No shadow
  - Photo thumbnail: 80x80pt, rounded 8pt
- **Buttons:**
  - Primary: Accent color background, white text, 48pt height
  - Secondary: Border only, primary color text
  - Destructive: Red background (#E53935)
  - Press state: 80% opacity
- **Forms:**
  - Input height: 48pt
  - Border radius: 8pt
  - Background: white with border
  - Focus state: primary color border
- **Ad Placeholders:**
  - Height: 60pt (banner)
  - Background: #F0F0F0
  - Text: "Ad Space" centered in gray
  - Border radius: 8pt
- **Pro Upgrade Badges:**
  - Gold background (#FFD700)
  - Small crown icon
  - "PRO" text in bold

### Critical Assets
1. **User Avatars (3 presets):** Fishing-themed silhouettes - angler with rod (standing), angler in boat, angler casting
2. **Empty State Illustration:** Simple fishing rod icon/illustration for empty catches list
3. **Weather Icons (4):** Sunny, cloudy, rainy, windy (simple, outlined style matching Feather)

### Accessibility
- Minimum touch target: 44x44pt
- Color contrast ratio: 4.5:1 for text
- Form inputs have visible labels
- Buttons have descriptive accessibility labels
- Support dynamic type scaling