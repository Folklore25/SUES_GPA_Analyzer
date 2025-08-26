# TODO List

This file tracks the major tasks for improving the SUES GPA Analyzer.

---

## UI/UX Improvement Plan (Refactoring with Material Design)

This plan outlines the migration of the UI to React with the MUI component library to achieve a modern Material Design look and feel.

### Phase 1: Foundation & Setup

- [ ] **1. Install MUI Dependencies:**
    - [ ] Install core library: `@mui/material @emotion/react @emotion/styled`.
    - [ ] Install icons library: `@mui/icons-material`.

- [ ] **2. Configure Theme and Fonts:**
    - [ ] Link the Material Design standard font (Roboto) in `frontend/index.html`.
    - [ ] Create a basic MUI theme file (`frontend/src/theme.js`) to define a consistent color palette.
    - [ ] Implement a Dark Mode toggle and provider, allowing users to switch between light and dark themes.

### Phase 2: Component Refactoring

The goal is to replace basic HTML elements with MUI components for an improved look, feel, and accessibility.

- [ ] **1. Refactor `Login.jsx`:**
    - [ ] Replace `<input>` and `<button>` with MUI's `<TextField>`, `<Checkbox>`, and `<Button>` components.
    - [ ] Use `<Card>` and `<CardContent>` to create a visually appealing login form container.
    - [ ] Add icons to input fields using `<InputAdornment>` and icons from `@mui/icons-material`.

- [ ] **2. Refactor `Dashboard.jsx`:**
    - [ ] Replace the button-based navigation with MUI's `<Tabs>` and `<Tab>` components for a proper tabbed interface.
    - [ ] Use layout components like `<Container>` and `<Box>` to structure the main page.

- [ ] **3. Refactor `CourseList.jsx`:**
    - [ ] Replace the HTML `<table>` with MUI's `<Table>`, `<TableContainer>`, and `<Paper>` components to create a styled and responsive data table.

- [ ] **4. Refactor `RetakePlanner.jsx`:**
    - [ ] Replace planner controls with MUI's `<Select>`, `<TextField>`, and `<Button>`.
    - [ ] Display the plan results within a `<Card>` for better visual grouping.

### Phase 3: Polishing & User Experience

- [ ] **1. Enhance Feedback:**
    - [ ] Replace text-based loading states (e.g., "Loading...") with MUI's `<CircularProgress>` or `<Skeleton>` components for a better visual experience.
    - [ ] Design and implement "empty state" views for when no data is available (e.g., when the course list is empty).

- [ ] **2. Final Review:**
    - [ ] Conduct a full review of the UI in both light and dark modes.
    - [ ] Test for responsiveness and consistency across all components.

---

## Completed: Security Enhancement

**Description:** Migrated plain-text password storage to the OS's secure credential manager using `keytar`.

- [x] **1. Added `keytar` dependency.**
- [x] **2. Modified `save-user-info` logic in `main.js`.**
- [x] **3. Modified `load-user-info` logic in `main.js`.**
- [x] **4. Implemented one-time data migration for existing users.**
