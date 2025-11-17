# Hofstra Course Planner

A modern, intuitive course scheduling and professor rating application for Hofstra University students, built with React Native and Expo.

## Overview

Hofstra Course Planner streamlines the course selection process by combining course scheduling, professor ratings, and interactive calendar management into one seamless mobile experience. Students can browse available courses, check professor ratings, and build their ideal schedule with an intuitive drag-free interface.

## Features

### 📅 Interactive Calendar View
- **Visual Weekly Schedule**: Clean, scrollable calendar interface showing courses across all weekdays
- **Horizontal Scroll**: View 3-4 days at a time with smooth horizontal scrolling
- **Fixed Time Column**: Time slots remain visible while scrolling through days
- **One-Tap Course Removal**: Click any course block to remove it from your schedule with confirmation
- **Color-Coded Courses**: Each course is assigned a unique color for easy visual identification
- **Real-Time Updates**: Changes reflect instantly across all tabs

### 📚 Course Browser
- **Comprehensive Course Listings**: Browse Computer Science and Engineering courses for Spring 2026
- **Advanced Search**: Search by course code, title, instructor, or CRN
- **Smart Filtering**: Filter courses by department (All, CS, Engineering)
- **Flexible Sorting**: Sort by course code, title, instructor, credits, seats available, or status
- **Quick Add**: One-tap course addition with visual feedback
- **Status Indicators**: See course availability at a glance (Open/Closed)
- **Detailed Information**: View schedule, instructor, credits, enrollment stats, and waitlist data
- **Lazy Loading**: Smooth pagination for optimal performance

### ⭐ Professor Ratings
- **RateMyProfessor Integration**: Real-time data from RateMyProfessor API
- **Comprehensive Metrics**:
  - Overall rating (1-5 scale)
  - Difficulty level
  - Would take again percentage
  - Total number of ratings
- **Professor Search**: Find specific professors quickly
- **Detailed Reviews**: View individual student ratings and comments organized by class
- **Smart Filtering**: Filter reviews by specific course
- **Multi-Sort Options**: Sort by rating, difficulty, or date
- **Interactive Cards**: Tap any professor to view their full profile and reviews

### 🎨 User Experience
- **Dark Mode Support**: Automatic theme switching based on system preferences
- **Haptic Feedback**: Tactile feedback on interactions for better user experience
- **Responsive Design**: Optimized for various screen sizes
- **Smooth Animations**: Polished transitions and interactions
- **Professional UI**: Clean, modern interface with consistent design language

## Tech Stack

### Core Framework
- **React Native** (0.81.5) - Cross-platform mobile development
- **Expo** (~54.0) - Development platform and tooling
- **TypeScript** (~5.9.2) - Type-safe JavaScript

### Navigation & State Management
- **Expo Router** (~6.0) - File-based routing system
- **React Navigation** (^7.1.8) - Navigation infrastructure
- **React Context API** - Global state management for scheduled courses

### UI & Interactions
- **React Native Gesture Handler** (~2.28.0) - Advanced gesture handling
- **React Native Reanimated** (~4.1.1) - Smooth animations
- **Expo Haptics** (~15.0.7) - Tactile feedback
- **Expo Symbols** (~1.0.7) - SF Symbols icon support

### Data & APIs
- **RateMyProfessor API** - Professor ratings and reviews
- **Local JSON Data** - Spring 2026 course schedules

### Development Tools
- **ESLint** (^9.25.0) - Code quality and consistency
- **Expo Dev Tools** - Debugging and development utilities

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- iOS Simulator (Mac only) or Android Emulator
- Expo Go app (for physical device testing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd HCI_Final
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run the app**
   - Press `i` for iOS Simulator
   - Press `a` for Android Emulator
   - Scan the QR code with Expo Go app for physical device testing

### Available Scripts

```bash
npm start          # Start Expo development server
npm run android    # Run on Android emulator
npm run ios        # Run on iOS simulator
npm run web        # Run in web browser
npm run lint       # Run ESLint
```

## Project Structure

```
HCI_Final/
├── app/
│   ├── (tabs)/
│   │   ├── index.tsx              # Home - Calendar view
│   │   ├── courses.tsx            # Courses browser
│   │   ├── ratings.tsx            # Professor ratings
│   │   └── _layout.tsx            # Tab navigation layout
│   ├── professor/
│   │   └── [id].tsx               # Professor detail page
│   └── _layout.tsx                # Root layout
├── components/
│   ├── themed-text.tsx            # Themed text component
│   ├── themed-view.tsx            # Themed view component
│   ├── haptic-tab.tsx             # Tab with haptic feedback
│   └── ui/
│       └── icon-symbol.tsx        # Icon component
├── contexts/
│   └── ScheduleContext.tsx        # Global schedule state
├── constants/
│   └── theme.ts                   # Theme colors and styling
├── hooks/
│   └── use-color-scheme.ts        # Dark/light mode hook
├── class_schedule_spring_2026.json      # CS course data
├── engineering_schedule_spring_2026.json # Engineering course data
└── package.json
```

## Key Components

### ScheduleContext
Global state management for scheduled courses, providing:
- `scheduledCourses`: Array of courses added to the calendar
- `addCourse(course)`: Add a course to the schedule
- `removeCourse(crn)`: Remove a course by CRN

### Course Interface
```typescript
interface Course {
  crn: string;              // Course Reference Number
  subject: string;          // Subject code (e.g., "CSC")
  course: string;           // Course number
  section: string;          // Section number
  title: string;            // Course title
  instructor: string;       // Instructor name
  credits: number;          // Credit hours
  days?: string;            // Meeting days
  time?: string;            // Meeting time
  schedule?: Array<{        // Multiple meeting times
    days: string;
    time: string;
  }>;
  campus: string;           // Campus location
  capacity: number;         // Maximum enrollment
  actual: number;           // Current enrollment
  remaining: number;        // Available seats
  waitlist_capacity: number;
  waitlist_actual: number;
  waitlist_remaining: number;
  status: string;           // "Open" or "Closed"
}
```

## Features in Detail

### Calendar Management
The interactive calendar provides a visual representation of your weekly schedule:
- **Time-based positioning**: Courses are automatically positioned based on their meeting times
- **Multi-day support**: Courses meeting on multiple days appear on each relevant day column
- **Conflict detection**: Visual overlap shows scheduling conflicts
- **Manual adjustment**: Fine-tune positioning with the spacing parameter if needed

### Course Data
The app includes comprehensive Spring 2026 course data for:
- **Computer Science (CSC)**: All undergraduate and graduate CS courses
- **Engineering (ENGG)**: All engineering department courses

Each course listing includes:
- Complete schedule information
- Instructor details
- Enrollment statistics
- Waitlist information
- Campus location
- Credit hours

### Professor Ratings Integration
Real-time integration with RateMyProfessor provides:
- Live data from Hofstra University's RMP page
- Detailed student reviews and ratings
- Historical rating trends
- Class-specific feedback
- Overall professor metrics

## Customization

### Adjusting Calendar Spacing
In [index.tsx](app/(tabs)/index.tsx), line 160:
```typescript
const spacing = -60; // Adjust this value to fine-tune course block positioning
```

### Modifying Color Scheme
In [ScheduleContext.tsx](contexts/ScheduleContext.tsx):
```typescript
const courseColors = [
  '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981',
  '#06B6D4', '#6366F1', '#EF4444', '#14B8A6', '#F97316',
];
```

### Theme Colors
In [constants/theme.ts](constants/theme.ts), customize light/dark mode colors.

## Known Limitations

- Course data is static (Spring 2026 semester)
- No backend synchronization
- No user authentication
- No course conflict warnings
- RateMyProfessor data depends on API availability

## Future Enhancements

Potential features for future development:
- [ ] User accounts and cloud sync
- [ ] Multiple semester support
- [ ] Course conflict detection and warnings
- [ ] Export schedule to PDF/iCal
- [ ] Push notifications for course openings
- [ ] Course prerequisites checking
- [ ] GPA calculator
- [ ] Degree progress tracking
- [ ] Share schedules with friends
- [ ] Custom color themes

## Contributing

This is an academic project for Human-Computer Interaction. Contributions, suggestions, and feedback are welcome!

## License

This project is developed as part of an academic assignment at Hofstra University.

## Acknowledgments

- **Hofstra University** - Course data
- **RateMyProfessor** - Professor ratings API
- **Expo Team** - Development platform
- **React Native Community** - Open-source components

---

**Built with ❤️ for Hofstra University students**
