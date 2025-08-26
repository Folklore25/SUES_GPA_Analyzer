# React Migration Plan

This document outlines the step-by-step plan to migrate the application's frontend from vanilla JavaScript to React with Vite.

## Phase 1: Login and Authentication

The goal of this phase is to completely replace the initial login screen with a React component.

- [ ] **1. Create Login Component:**
    - [ ] Create a new file: `frontend/src/components/Login.jsx`.
    - [ ] Build the UI for the login form (username, password, URL inputs, and "Remember Me" checkbox) using JSX.

- [ ] **2. Implement State Management:**
    - [ ] Use the `useState` hook within the `Login` component to manage the state of the form inputs.

- [ ] **3. Implement Event Handlers:**
    - [ ] Create an `onSubmit` handler for the form.
    - [ ] This handler will call the existing Electron IPC functions via `window.electronAPI.saveUserInfo(...)` and `window.electronAPI.startCrawler(...)`.

- [ ] **4. Load Initial Data:**
    - [ ] Use the `useEffect` hook to call `window.electronAPI.loadUserInfo()` when the component mounts, to pre-fill the form if user info was saved.

- [ ] **5. Main App Logic:**
    - [ ] Update `frontend/src/App.jsx` to conditionally render the `Login` component.

## Phase 2: Dashboard and Data Display

This phase focuses on building the main application view after the user has logged in and data is available.

- [ ] **1. Create Dashboard Component:**
    - [ ] Create a new file: `frontend/src/components/Dashboard.jsx`.
    - [ ] This component will be the main container for all data visualizations and tables.

- [ ] **2. Global State for Course Data:**
    - [ ] In `App.jsx`, manage the application's core state: the loaded course data and the login status.
    - [ ] Pass the course data down to the `Dashboard` component as props.
    - [ ] The `Login` component will now be responsible for updating the login status in the parent `App.jsx` component upon successful data fetching.

- [ ] **3. Create Course List Component:**
    - [ ] Create a new file: `frontend/src/components/CourseList.jsx`.
    - [ ] This component will receive the course data as props and render the tables for "已修课程" (Passed Courses) and "未修课程" (Failed/Not Taken Courses).

## Phase 3: Porting Core Features

- [ ] **1. Charting Component:**
    - [ ] **Dependency:** Add a React charting library (e.g., `recharts`).
    - [ ] **Component:** Create `frontend/src/components/Charts.jsx`.
    - [ ] **Implementation:** Re-implement the "学期GPA趋势图" (Semester GPA Trend) and "成绩分布图" (Grade Distribution) charts using the new library.

- [ ] **2. Retake Planner Component:**
    - [ ] **Component:** Create `frontend/src/components/RetakePlanner.jsx`.
    - [ ] **UI:** Build the UI for selecting a strategy, setting a target GPA, and displaying the results.
    - [ ] **Logic:** Import and reuse the existing logic from `retake-engine.js` to generate the retake plan based on user input.

## Phase 4: Cleanup and Finalization

- [ ] **1. Delete Obsolete Files:**
    - [ ] Once all functionality is confirmed to be working in the new React UI, delete the entire `public` directory.

- [ ] **2. Code Review:**
    - [ ] Review all new React components for code quality, consistency, and performance.
    - [ ] Ensure all original features are working as expected.
