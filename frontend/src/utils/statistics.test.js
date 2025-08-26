import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { parseCSV } from './csvParser';
import { calculateCurrentGPA } from './gpaCalculations';

// This test suite validates the core statistics based on a real data file.
// It assumes the app has been run at least once to generate courses.csv.
describe('Dashboard Statistics Calculation', () => {

  it('should calculate the correct stats based on the user\'s data', () => {
    // Construct the path to the courses.csv file in the app's user data directory
    const userDataPath = process.env.APPDATA || (process.platform == 'darwin' ? process.env.HOME + '/Library/Application Support' : process.env.HOME + "/.config");
    const csvPath = path.join(userDataPath, 'sues-gpa-analyzer', 'courses.csv');

    // Check if the data file exists before running the test
    if (!fs.existsSync(csvPath)) {
      console.warn(`Skipping statistics test: ${csvPath} not found.`);
      return;
    }

    const csvData = fs.readFileSync(csvPath, 'utf8');
    const courseData = parseCSV(csvData);

    // --- Stat Calculations ---

    // 1. Calculate Total Credits Taken
    // Rule: Sum the 'course_weight' for all courses that have a recorded score/grade.
    const totalCredits = courseData
      .filter(c => c.course_score && c.course_score !== '--')
      .reduce((sum, course) => sum + (parseFloat(course.course_weight) || 0), 0);

    // 2. Calculate Passed Courses
    // Rule: Count courses where the 'pass' status is 'passed'.
    const passedCourses = courseData.filter(c => c.pass === 'passed').length;

    // 3. Calculate Current Weighted GPA
    // This uses the dedicated function which has its own specific rules.
    const gpa = calculateCurrentGPA(courseData);

    // --- Assertions ---
    // Verify that the calculated values match the user's expected output.

    console.log(`Calculated GPA: ${gpa.toFixed(2)}`);
    console.log(`Calculated Total Credits: ${totalCredits}`);
    console.log(`Calculated Passed Courses: ${passedCourses}`);

    expect(gpa).toBeCloseTo(3.36, 2);
    expect(totalCredits).toBe(128);
    expect(passedCourses).toBe(69);
  });
});
