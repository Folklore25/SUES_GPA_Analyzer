# SUES GPA Analyzer - Developer Guide

## Project Overview

SUES GPA Analyzer is an Electron-based desktop application designed specifically for students at Shanghai University of Engineering Science (SUES) to analyze their GPA and academic performance. The application automatically fetches course data from the university's academic system, performs sophisticated GPA calculations, and provides interactive data visualization and retake planning tools.

## Architecture

The application follows a modern Electron architecture with clear separation between the main process, renderer process, and data processing components:

```
SUES_GPA_Analyzer/
├── main.js                    # Electron main process entry point
├── package.json              # Project dependencies and scripts
├── vite.config.js            # Vite configuration for frontend
├── forge.config.js           # Electron Forge configuration
├── src/
│   ├── crawler/
│   │   ├── crawler.js        # Web scraping logic using Playwright
│   │   └── config.json       # Browser configuration for crawling
│   ├── renderer/
│   │   └── preload.js        # Secure IPC bridge between main and renderer
│   └── utils/
│       └── iniHelper.js      # INI file handling for configuration
├── frontend/
│   ├── index.html           # Frontend entry point
│   └── src/
│       ├── App.jsx          # Root React component
│       ├── components/      # React UI components
│       │   ├── Login.jsx
│       │   ├── Dashboard.jsx
│       │   ├── Charts.jsx
│       │   ├── CourseList.jsx
│       │   ├── RetakePlanner.jsx
│       │   └── PlanFAB.jsx
│       └── utils/
│           ├── csvParser.js
│           ├── gpaCalculations.js
│           └── formatter.js
└── scripts/
    ├── convert-icon.js
    └── removeLocales.js
```

## Main Process (main.js)

The main process handles:
- Electron application lifecycle management
- Browser window creation and management
- Secure IPC communication with the renderer
- User data storage and retrieval
- Web scraping process management
- Data migration from old versions

### Key IPC Handlers

- `start-crawler`: Initiates the web scraping process in a utility process
- `load-course-data`: Reads course data from the user's data directory
- `save-user-info`: Saves user credentials and preferences to INI file and keytar
- `load-user-info`: Retrieves user credentials from INI file and keytar
- `delete-user-data`: Deletes all user data including credentials and course data
- `open-external-url`: Opens external URLs in the default browser

### Data Storage

- **User credentials and preferences**: Stored in an INI file in the user's application data directory
- **Passwords**: Securely stored using `keytar` in the OS keychain
- **Course data**: Stored as CSV in the user's application data directory

## Renderer Process (Frontend)

The renderer process is built with React and Material-UI, providing a modern user interface for GPA analysis.

### Core Components

#### App.jsx
- Manages application state including login status and theme
- Controls navigation between login and dashboard views
- Implements light/dark theme switching

#### Login.jsx
- Handles user authentication to the university system
- Manages "Remember me" functionality
- Displays tutorial dialog on first use
- Provides link to usage tutorial video

#### Dashboard.jsx
- Main application dashboard showing GPA statistics
- Tabbed interface for different data views (Charts, Course List, Retake Planner)
- Provides controls for data refresh and user data management
- Integrates with the floating action button (PlanFAB)

#### Charts.jsx
- Implements multiple data visualization charts using ECharts
- GPA trend over semesters (line chart)
- Grade distribution (pie chart)
- Credit vs. GPA bubble chart (scatter plot)
- Semester performance heatmap
- Charts are thematically consistent with MUI components

#### CourseList.jsx
- Displays all courses in a grouped table format
- Groups courses by credit value
- Implements filtering and sorting capabilities
- Allows adding courses to retake plan

#### RetakePlanner.jsx
- Visual tool for planning course retakes
- Shows potential GPA improvement scenarios
- Provides detailed analysis of retake options

#### PlanFAB.jsx
- Floating action button for the retake plan
- Draggable UI element showing number of planned courses
- Provides quick access to the retake plan

### Utilities

#### gpaCalculations.js
Contains all GPA calculation logic:
- `calculateCurrentGPA()`: Calculates overall weighted GPA
- `processGpaTrendData()`: Processes data for semester GPA trends
- `processGradeDistributionData()`: Processes grade distribution for pie charts
- `processCreditGpaBubbleData()`: Processes data for bubble chart visualization
- `processGpaHeatmapData()`: Processes data for semester performance heatmap

#### csvParser.js
Handles CSV parsing with proper handling of quoted fields and special characters.

## Web Scraping (crawler.js)

The web scraping functionality is implemented in a separate utility process to isolate browser automation from the main application:

- Uses Playwright to automate browser interactions
- Logs into the university's academic system
- Navigates through multiple authentication steps
- Extracts course data from the academic portal
- Saves extracted data to CSV format
- Communicates results back to the main process via IPC

### Configuration (config.json)
- Browser type (default: Chromium with MS Edge channel)
- Headless mode (configured to false for university login)
- Browser launch arguments optimized for university systems

## Security Features

1. **Secure Credential Storage**: Passwords are encrypted using `keytar` and stored in the OS keychain
2. **Secure IPC**: All communication between main and renderer processes is properly sanitized
3. **Data Isolation**: Web scraping runs in a separate utility process
4. **Data Deletion**: Complete data removal functionality for user privacy

## Data Model

The application processes course data with the following structure:
```javascript
{
  course_name: string,
  course_code: string,
  course_semester: string,
  course_attribute: string,
  course_weight: number (credit weight),
  course_score: string (grade like A, B+, etc.),
  course_gpa: number,
  pass: string ('passed', 'failed', 'unrepaired')
}
```

## GPA Calculation Rules

1. Only passed courses with GPA > 0 are included in current GPA calculation
2. Weighted GPA = Σ(credit × gpa) / Σ(credits)
3. Different charts use different aggregation methods based on semester, credit, and performance metrics

## Development Environment

### Prerequisites
- Node.js 16+ 
- npm or yarn
- Git

### Setup Instructions
```bash
# Install dependencies
npm install

# Start development server for frontend
npm run dev:frontend

# In another terminal, start Electron app
npm run dev:electron
# Or start both simultaneously:
npm run dev
```

### Production Build
```bash
# Build frontend
npm run build:frontend

# Package Electron app
npm run package

# Build with rebuild for native modules like keytar
npm run build
```

## Testing

The application uses Vitest for unit testing:
```bash
npm run test
```

## Deployment

The application is configured for packaging using Electron Forge:
- Automated packaging with appropriate app icons
- Removal of unnecessary locales to reduce package size
- Proper handling of native modules like keytar

## Upcoming Features

### Planned for Next Version
1. **Software Update Button**: In-app mechanism to check and install updates
2. **AI Integration**: Native large language model integration for enhanced analysis and insights
3. **Advanced Analytics**: More sophisticated GPA prediction and planning tools
4. **Export Functionality**: Enhanced data export options

## Project Dependencies

### Key Dependencies
- **Electron**: Cross-platform desktop application framework
- **React**: Frontend UI library
- **Material-UI**: Component library for consistent UI
- **Playwright**: Browser automation for web scraping
- **ECharts**: Interactive data visualization library
- **keytar**: Secure password storage in OS keychain
- **Vite**: Frontend build tool

### Development Dependencies
- **Electron Forge**: Packaging and distribution tools
- **Vitest**: Testing framework
- **@vitejs/plugin-react**: React plugin for Vite

## Code Quality and Maintenance

- The codebase follows modern JavaScript/React best practices
- Security is prioritized with proper IPC sanitization and credential handling
- The modular architecture allows for easy extension of functionality
- Comprehensive error handling throughout the application
- Detailed comments for complex algorithms and business logic

## Troubleshooting

### Common Issues
- **Login failures**: Verify university system URL and credentials
- **Browser automation**: Ensure Playwright browsers are properly installed
- **Keytar issues**: May require rebuild for target platform
- **Data persistence**: Check application data directory permissions

### Debugging
- Enable Electron dev tools for renderer process debugging
- Check console logs in both main and utility processes
- Monitor CSV file generation for data scraping verification

## Contributing

The project welcomes contributions. Please follow the established code style and maintain the security-focused approach to credential handling. All new features should include appropriate error handling and data privacy considerations.