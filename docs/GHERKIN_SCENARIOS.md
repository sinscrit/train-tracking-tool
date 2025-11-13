# Train Service Tracking Tool - Gherkin Test Scenarios

**Document Version:** 1.0  
**Last Updated:** November 11, 2025  
**Author:** Manus AI

---

## Purpose

This document provides comprehensive Gherkin test scenarios for all features in the Train Service Tracking Tool. Each scenario follows the Given-When-Then format and covers positive cases, negative cases, edge cases, and boundary conditions to ensure complete test coverage.

---

## Table of Contents

### Functional Features
1. [Multi-System Data Verification](#feature-1-multi-system-data-verification)
2. [Schedule Data Management](#feature-2-schedule-data-management)
3. [Régime Classification System](#feature-3-régime-classification-system)
4. [Grouped View Mode](#feature-4-grouped-view-mode)
5. [Spreadsheet View Mode](#feature-5-spreadsheet-view-mode)
6. [Calendar View Mode](#feature-6-calendar-view-mode)
7. [Advanced Filtering System](#feature-7-advanced-filtering-system)
8. [Interactive Calendar Date Details](#feature-8-interactive-calendar-date-details)
9. [Statistics Dashboard](#feature-9-statistics-dashboard)

### UX Features
10. [Responsive Layout Design](#feature-10-responsive-layout-design)
11. [Dark Theme Interface](#feature-11-dark-theme-interface)
12. [Interactive Controls](#feature-12-interactive-controls)
13. [Visual Hierarchy](#feature-13-visual-hierarchy)
14. [Loading States and Feedback](#feature-14-loading-states-and-feedback)
15. [Data Styling and Visual Indicators](#feature-15-data-styling-and-visual-indicators)

---

## Feature 1: Multi-System Data Verification

### Scenario 1.1: Verify service with all systems matching
```gherkin
Feature: Multi-System Data Verification
  As a train coordinator
  I want to verify train schedules across multiple systems
  So that I can ensure data consistency

Scenario: All systems have matching schedules
  Given a train service "9320" on "2025-06-20"
  And Totem+ has schedule with "BRU dep: 09:43, WNH arr: 10:09, PNO arr: 11:05"
  And Tam Tam has schedule with "BRU dep: 09:43, WNH arr: 10:09, PNO arr: 11:05"
  And eRoster has schedule with "BRU dep: 09:43, WNH arr: 10:09, PNO arr: 11:05"
  When I view the service in the table
  Then the TamTam column should show a green checkmark
  And the eRoster column should show a green checkmark
```

### Scenario 1.2: Detect TamTam schedule discrepancy
```gherkin
Scenario: TamTam has different time than Totem+
  Given a train service "9339" on "2025-06-20"
  And Totem+ has schedule with "PNO dep: 12:22, WNH arr: 13:18"
  And Tam Tam has schedule with "PNO dep: 12:22, WNH arr: 13:20"
  And eRoster has schedule with "PNO dep: 12:22, WNH arr: 13:18"
  When I view the service in the table
  Then the TamTam column should show a yellow warning triangle
  And the eRoster column should show a green checkmark
```

### Scenario 1.3: Detect missing eRoster data
```gherkin
Scenario: eRoster has no schedule data
  Given a train service "9339" on "2025-07-11"
  And Totem+ has schedule with "PNO dep: 12:22, WNH arr: 13:18"
  And Tam Tam has schedule with "PNO dep: 12:22, WNH arr: 13:18"
  And eRoster has no schedule data
  When I view the service in the table
  Then the TamTam column should show a green checkmark
  And the eRoster column should show a red X
```

```gherkin
Scenario: Service not available for ticket sales
  Given a train service "9395" on "2025-07-11"
  And Totem+ has a valid schedule
  And Tam Tam has a matching schedule
  And eRoster has no schedule data
  When I view the service in the table
```

### Scenario 1.5: Multiple simultaneous discrepancies
```gherkin
Scenario: Service has issues in all systems
  Given a train service "9376" on "2025-07-18"
  And Totem+ has schedule with "AMS dep: 17:10, HDK arr: 18:16"
  And Tam Tam has no schedule data
  And eRoster has schedule with "AMS dep: 17:15, HDK arr: 18:20"
  When I view the service in the table
  Then the TamTam column should show a red X
  And the eRoster column should show a yellow warning triangle
```

### Scenario 1.6: Partial schedule comparison
```gherkin
Scenario: Compare partial schedules correctly
  Given a train service "9320" with return journey only
  And Totem+ has return schedule with "BRU dep: 09:43, PNO arr: 11:05"
  And Totem+ has no outbound schedule
  And Tam Tam has return schedule with "BRU dep: 09:43, PNO arr: 11:05"
  And Tam Tam has no outbound schedule
  When I verify the schedules
  Then the comparison should only check return journey stations
  And the TamTam column should show a green checkmark
```

---

## Feature 2: Schedule Data Management

### Scenario 2.1: Display complete outbound and return journey
```gherkin
Feature: Schedule Data Management
  As a train coordinator
  I want to view complete train schedules
  So that I can track all station times

Scenario: Service with full outbound and return journeys
  Given a train service "9339" on "2025-06-20"
  And the service has outbound journey "PNO dep: 12:22, WNH arr: 13:18, BRU arr: 13:44, BRU dep: 13:53, HDK arr: 14:45, AMS arr: 15:50"
  And the service has return journey "AMS dep: 16:00, HDK arr: 16:50, BRU arr: 17:30, BRU dep: 17:40, WNH arr: 18:10, PNO arr: 19:00"
  When I view the service in the table
  Then I should see all 6 outbound station times
  And I should see all 6 return station times
```

### Scenario 2.2: Display return-only service
```gherkin
Scenario: Service with return journey only
  Given a train service "9320" on "2025-06-20"
  And the service has no outbound journey
  And the service has return journey "BRU dep: 09:43, WNH arr: 10:09, PNO arr: 11:05"
  When I view the service in the table
  Then all outbound columns should show "-"
  And the return columns should show the scheduled times
```

### Scenario 2.3: Display outbound-only service
```gherkin
Scenario: Service with outbound journey only
  Given a train service "9395" on "2025-06-20"
  And the service has outbound journey "PNO dep: 21:34, WNH arr: 22:43, BRU arr: 23:09"
  And the service has no return journey
  When I view the service in the table
  Then the outbound columns should show the scheduled times
  And all return columns should show "-"
```

### Scenario 2.4: Handle missing station times
```gherkin
Scenario: Partial journey with missing intermediate stations
  Given a train service "9376" on "2025-06-20"
  And the service has return journey with stations "AMS dep, HDK arr, BRU arr, BRU dep, WNH arr, PNO arr"
  And the station "HDK arr" has no time
  When I view the service in the table
  Then the "HDK arr" column should show "-" in gray
  And other stations should show their scheduled times
```

### Scenario 2.5: Display border crossing indicators
```gherkin
Scenario: Identify border crossing stations
  Given a train service "9339" on "2025-06-20"
  And the station "WNH arr: 13:18" is marked as border crossing
  And the station "HDK arr: 14:45" is marked as border crossing
  When I view the service in the table
  Then "13:18" should be displayed in red italic text
  And "14:45" should be displayed in red italic text
```

### Scenario 2.6: Display changed time indicators
```gherkin
Scenario: Identify changed schedule times
  Given a train service "9376" on "2025-06-20"
  And the station "PNO arr: 20:35" is marked as changed
  When I view the service in the table
  Then "20:35" should be displayed with yellow text on dark background
```

---

## Feature 3: Régime Classification System

### Scenario 3.1: Display Vendredi régime services
```gherkin
Feature: Régime Classification System
  As a train coordinator
  I want to categorize services by operational régime
  So that I can understand weekly schedule patterns

Scenario: View services with Vendredi régime
  Given there are 4 train services with "Vendredi" régime
  And the Vendredi color is set to "#ec4899" (magenta)
  When I view the service table
  Then each Vendredi service should have a 4px magenta left border
```

### Scenario 3.2: Display Samedi régime services
```gherkin
Scenario: View services with Samedi régime
  Given there are 4 train services with "Samedi" régime
  And the Samedi color is set to "#3b82f6" (blue)
  When I view the service table
  Then each Samedi service should have a 4px blue left border
```

### Scenario 3.3: View Régimé reference section
```gherkin
Scenario: Display régimé template schedules
  Given there are régimé template services for "Vendredi" and "Samedi"
  When I view the top of the page
  Then I should see a "Régimé" section
  And the section should show template services with colored badges
  And the template services should have no date
  And the verification columns should have headers but no content
```

### Scenario 3.4: Filter by single régime
```gherkin
Scenario: Show only Vendredi services
  Given there are services with régimes "Vendredi", "Samedi", and "Dimanche"
  And all régime filters are initially checked
  When I uncheck the "Samedi" filter
  And I uncheck the "Dimanche" filter
  Then I should only see services with "Vendredi" régime
  And the Samedi and Dimanche services should be hidden
```

### Scenario 3.5: Filter by multiple régimes
```gherkin
Scenario: Show weekend services only
  Given there are services with various régimes
  And all régime filters are initially checked
  When I uncheck all filters except "Samedi" and "Dimanche"
  Then I should see all Samedi services
  And I should see all Dimanche services
  And weekday services should be hidden
```

### Scenario 3.6: Customize Vendredi color
```gherkin
Scenario: Change Vendredi régime color
  Given the Vendredi color is "#ec4899"
  And there are Vendredi services displayed
  When I open the Vendredi color picker
  And I select color "#ff0000" (red)
  Then all Vendredi service borders should change to red
  And the Vendredi checkbox indicator should change to red
```

### Scenario 3.7: Customize Samedi color
```gherkin
Scenario: Change Samedi régime color
  Given the Samedi color is "#3b82f6"
  And there are Samedi services displayed
  When I open the Samedi color picker
  And I select color "#00ff00" (green)
  Then all Samedi service borders should change to green
  And the Samedi checkbox indicator should change to green
```

---

## Feature 4: Grouped View Mode

### Scenario 4.1: View services grouped by date
```gherkin
Feature: Grouped View Mode
  As a train coordinator
  I want to view services organized by date
  So that I can focus on specific operational days

Scenario: Display date groups with train counts
  Given there are 4 services on "2025-06-20"
  And there are 4 services on "2025-06-21"
  And the view mode is "Grouped"
  When I view the page
  Then I should see a group header "20/06/25" with "4 trains"
  And I should see a group header "21/06/25" with "4 trains"
```

### Scenario 4.2: Expand single date group
```gherkin
Scenario: Show services for a specific date
  Given the view mode is "Grouped"
  And the date group "20/06/25" is collapsed
  When I click on the "20/06/25" header
  Then the date group should expand
  And I should see a table with 4 train services
  And each service should show full schedule details
```

### Scenario 4.3: Collapse expanded date group
```gherkin
Scenario: Hide services for a date
  Given the view mode is "Grouped"
  And the date group "20/06/25" is expanded
  When I click on the "20/06/25" header
  Then the date group should collapse
  And the service table should be hidden
```

### Scenario 4.4: Expand all date groups
```gherkin
Scenario: View all services simultaneously
  Given the view mode is "Grouped"
  And there are 10 date groups
  And all groups are collapsed
  When I click the "Expand All" button
  Then all 10 date groups should expand
  And I should see service tables for all dates
```

### Scenario 4.5: Collapse all date groups
```gherkin
Scenario: Hide all service details
  Given the view mode is "Grouped"
  And there are 10 date groups
  And all groups are expanded
  When I click the "Collapse All" button
  Then all 10 date groups should collapse
  And only date headers should be visible
```

### Scenario 4.6: Expand only groups with issues
```gherkin
Scenario: Focus on problematic services
  Given the view mode is "Grouped"
  And date "2025-06-20" has 4 services with no issues
  And date "2025-07-11" has 4 services with 2 having issues
  And date "2025-07-18" has 4 services with 3 having issues
  And all groups are collapsed
  When I click the "Expand Issues Only" button
  Then the "2025-06-20" group should remain collapsed
  And the "2025-07-11" group should expand
  And the "2025-07-18" group should expand
```

### Scenario 4.7: Maintain expansion state when filtering
```gherkin
Scenario: Preserve user's expansion preferences
  Given the view mode is "Grouped"
  And the date group "2025-06-20" is expanded
  And the date group "2025-06-21" is collapsed
  When I apply a discrepancy filter
  Then the "2025-06-20" group should remain expanded
  And the "2025-06-21" group should remain collapsed
```

---

## Feature 5: Spreadsheet View Mode

### Scenario 5.1: Display all services in single table
```gherkin
Feature: Spreadsheet View Mode
  As a train coordinator
  I want to view all services in a continuous table
  So that I can analyze data across multiple dates

Scenario: View continuous service list
  Given there are services on dates "2025-06-20", "2025-06-21", "2025-06-27"
  And the view mode is "Spreadsheet"
  When I view the page
  Then I should see a single table
  And the table should contain all 12 services
  And there should be no date group headers
  And services should be listed sequentially
```

### Scenario 5.2: Scroll through large dataset
```gherkin
Scenario: Navigate long service list
  Given there are 40 services across 10 dates
  And the view mode is "Spreadsheet"
  When I scroll down the page
  Then the table header should remain visible (sticky)
  And I should be able to scroll through all 40 services
```

### Scenario 5.3: View all columns without grouping
```gherkin
Scenario: See complete schedule data in one view
  Given the view mode is "Spreadsheet"
  When I view a service row
  Then I should see the train number
  And I should see all 6 outbound station columns
  And I should see all 6 return station columns
  And I should see all 3 verification columns
  And the row should have no date label
```

### Scenario 5.4: Compare services across dates
```gherkin
Scenario: Analyze schedule patterns
  Given train "9320" runs on "2025-06-20" and "2025-06-21"
  And the view mode is "Spreadsheet"
  When I view the table
  Then I should see both instances of train "9320"
  And I should be able to visually compare their schedules
  And both rows should be in the same continuous table
```

### Scenario 5.5: Exclude régimé templates from spreadsheet
```gherkin
Scenario: Show only actual service data
  Given there are régimé template services
  And there are 40 actual services with dates
  And the view mode is "Spreadsheet"
  When I view the table
  Then I should see 40 service rows
  And régimé template services should not appear
```

---

## Feature 6: Calendar View Mode

### Scenario 6.1: Display monthly calendar grid
```gherkin
Feature: Calendar View Mode
  As a train coordinator
  I want to view services in a calendar format
  So that I can see service patterns over time

Scenario: View June 2025 calendar
  Given there are services in June 2025
  And the view mode is "Calendar"
  When I view the page
  Then I should see a calendar grid for "June 2025"
  And the grid should have 7 columns for days of the week
  And the grid should show all dates from 1 to 30
```

### Scenario 6.2: Show all-OK status on date cell
```gherkin
Scenario: Date with all systems verified
  Given date "2025-06-20" has 4 services
  And all services have TamTam verified
  And all services have eRoster verified
  And the view mode is "Calendar"
  When I view the June 2025 calendar
  Then the cell for "20" should show a green checkmark
  And no warning indicators should be visible
```

### Scenario 6.3: Show system-specific issues on date cell
```gherkin
Scenario: Date with discrepancies in multiple systems
  Given date "2025-07-11" has 4 services
  And 2 services have eRoster missing data
  And the view mode is "Calendar"
  When I view the July 2025 calendar
  Then the cell for "11" should show "TT" with green checkmark
  And the cell should show "eR" with red X
  And the cell should show "V" with yellow warning
```

### Scenario 6.4: Click date to view details
```gherkin
Scenario: Open date details popup
  Given date "2025-06-20" has 4 services
  And the view mode is "Calendar"
  When I click on the date cell "20"
  Then a popup dialog should open
  And the popup title should show "Train Details for 20/06/2025"
  And the popup should list all 4 services
```

### Scenario 6.5: Display multiple months
```gherkin
Scenario: View services across June and July
  Given there are services in June 2025
  And there are services in July 2025
  And the view mode is "Calendar"
  When I scroll down the page
  Then I should see the June 2025 calendar
  And I should see the July 2025 calendar below it
```

### Scenario 6.6: Empty date cells
```gherkin
Scenario: Dates with no services
  Given date "2025-06-15" has no services
  And the view mode is "Calendar"
  When I view the June 2025 calendar
  Then the cell for "15" should show only the date number
  And no status indicators should be visible
```

### Scenario 6.7: Hover over date cell
```gherkin
Scenario: Visual feedback on hoverable dates
  Given date "2025-06-20" has services
  And the view mode is "Calendar"
  When I hover over the date cell "20"
  Then the cell background should change to a lighter shade
  And the cursor should change to pointer
```

---

## Feature 7: Advanced Filtering System

### Scenario 7.1: Filter by "This Week"
```gherkin
Feature: Advanced Filtering System
  As a train coordinator
  I want to filter services by various criteria
  So that I can focus on relevant data

Scenario: Show only current week's services
  Given today is "2025-06-18" (Wednesday)
  And there are services on "2025-06-15" (Sunday)
  And there are services on "2025-06-20" (Friday)
  And there are services on "2025-06-22" (Sunday, next week)
  When I select "This Week" from the date range filter
  Then I should see services from "2025-06-15"
  And I should see services from "2025-06-20"
  And I should not see services from "2025-06-22"
```

### Scenario 7.2: Filter by "This Month"
```gherkin
Scenario: Show only current month's services
  Given today is "2025-06-18"
  And there are services in June 2025
  And there are services in July 2025
  When I select "This Month" from the date range filter
  Then I should only see June 2025 services
  And July services should be hidden
```

### Scenario 7.3: Filter by custom date range
```gherkin
Scenario: Show services within specific dates
  Given there are services from "2025-06-01" to "2025-07-31"
  When I select "Custom Range" from the date range filter
  And I enter start date "2025-06-20"
  And I enter end date "2025-06-30"
  Then I should only see services between June 20 and June 30
  And services outside this range should be hidden
```

### Scenario 7.4: Filter by "With Issues"
```gherkin
Scenario: Show only problematic services
  Given there are 40 total services
  And 7 services have discrepancies or missing data
  And 33 services are fully verified
  When I select "With Issues" from the discrepancy filter
  Then I should see exactly 7 services
  And all displayed services should have at least one issue
```

### Scenario 7.5: Filter by "Verified Only"
```gherkin
Scenario: Show only fully verified services
  Given there are 40 total services
  And 33 services are fully verified
  And 7 services have issues
  When I select "Verified Only" from the discrepancy filter
  Then I should see exactly 33 services
  And all displayed services should have green checkmarks in all columns
```

### Scenario 7.6: Filter by "TamTam Issues"
```gherkin
Scenario: Show services with TamTam problems
  Given there are 40 total services
  And 2 services have TamTam discrepancies or missing data
  When I select "TamTam Issues" from the discrepancy filter
  Then I should see exactly 2 services
  And both services should have yellow warning or red X in TamTam column
```

### Scenario 7.7: Combine date and discrepancy filters
```gherkin
Scenario: Apply multiple filters simultaneously
  Given there are services in June and July
  And some services have issues
  When I select "This Month" from date range filter
  And I select "With Issues" from discrepancy filter
  Then I should only see June services that have issues
  And verified June services should be hidden
  And all July services should be hidden
```

### Scenario 7.8: Combine all three filter types
```gherkin
Scenario: Apply date, discrepancy, and régime filters
  Given there are Vendredi and Samedi services in June
  And some services have eRoster issues
  When I select "This Month" from date range
  And I select "eRoster Issues" from discrepancy filter
  And I uncheck "Samedi" from régime filters
  Then I should only see June Vendredi services with eRoster issues
```

### Scenario 7.9: Clear all filters
```gherkin
Scenario: Reset to show all services
  Given filters are applied showing only 5 services
  When I select "All Dates" from date range
  And I select "All Trains" from discrepancy filter
  And I check all régime filters
  Then I should see all 40 services
```

### Scenario 7.10: Statistics update with filters
```gherkin
Scenario: Statistics reflect filtered dataset
  Given there are 40 total services with 7 issues
  And the statistics show "Total Trains: 40" and "Total Discrepancies: 7"
  When I select "With Issues" from discrepancy filter
  Then the statistics should show "Total Trains: 7"
  And the statistics should show "Total Discrepancies: 7"
```

---

## Feature 8: Interactive Calendar Date Details

### Scenario 8.1: Open popup from calendar date
```gherkin
Feature: Interactive Calendar Date Details
  As a train coordinator
  I want to view detailed schedules for a specific date
  So that I can review all trains operating that day

Scenario: Click date in calendar view
  Given the view mode is "Calendar"
  And date "2025-06-20" has 4 services
  When I click on date cell "20"
  Then a popup dialog should open
  And the popup should not close the calendar view behind it
```

### Scenario 8.2: Display popup header with formatted date
```gherkin
Scenario: Show date in readable format
  Given I clicked on date "2025-06-20" in the calendar
  When the popup opens
  Then the title should display "Train Details for 20/06/2025"
  And the date should be in DD/MM/YYYY format
```

### Scenario 8.3: Display all trains for selected date
```gherkin
Scenario: List all services operating on the date
  Given date "2025-06-20" has trains "9320", "9339", "9376", "9395"
  When I open the date details popup for "2025-06-20"
  Then I should see 4 train cards
  And each card should show the train number
```

### Scenario 8.4: Display verification status in train header
```gherkin
Scenario: Show system status icons for each train
  When I open the date details popup for "2025-07-11"
  Then the train "9339" card header should show "TT: ✓"
  And it should show "eR: ✗"
  And it should show "V: ✓"
```

### Scenario 8.5: Display full outbound schedule
```gherkin
Scenario: Show all outbound station times
  Given train "9339" on "2025-06-20" has outbound journey
  When I open the date details popup
  Then I should see a section titled "Outbound (PNO → AMS)"
  And I should see "PNO dep: 12:22"
  And I should see "WNH arr: 13:18"
  And I should see "BRU arr: 13:44"
  And I should see "BRU dep: 13:53"
  And I should see "HDK arr: 14:45"
  And I should see "AMS arr: 15:50"
```

### Scenario 8.6: Display full return schedule
```gherkin
Scenario: Show all return station times
  Given train "9320" on "2025-06-20" has return journey
  When I open the date details popup
  Then I should see a section titled "Return (AMS → PNO)"
  And I should see "BRU dep: 09:43"
  And I should see "WNH arr: 10:09"
  And I should see "PNO arr: 11:05"
```

### Scenario 8.7: Display border crossing times with styling
```gherkin
Scenario: Highlight border crossing stations
  Given train "9339" has "WNH arr: 13:18" marked as border crossing
  When I open the date details popup
  Then "13:18" should be displayed in red italic text
```

### Scenario 8.8: Display changed times with styling
```gherkin
Scenario: Highlight modified schedule times
  Given train "9376" has "PNO arr: 20:35" marked as changed
  When I open the date details popup
  Then "20:35" should be displayed with yellow text on dark background
```

### Scenario 8.9: Display legend explaining indicators
```gherkin
Scenario: Show legend for status icons and time styling
  When I open any date details popup
  Then I should see a legend section at the bottom
  And the legend should explain "✓ OK - No issues"
  And it should explain "⚠ Discrepancy - Schedule mismatch"
  And it should explain "✗ Missing data - System has no schedule"
  And it should explain border crossing time styling
  And it should explain changed time styling
```

### Scenario 8.10: Close popup with close button
```gherkin
Scenario: Dismiss popup using close button
  Given the date details popup is open
  When I click the "Close" button
  Then the popup should close
  And I should return to the calendar view
```

### Scenario 8.11: Close popup by clicking outside
```gherkin
Scenario: Dismiss popup by clicking backdrop
  Given the date details popup is open
  When I click outside the popup dialog
  Then the popup should close
  And I should return to the calendar view
```

### Scenario 8.12: Scroll within popup for many trains
```gherkin
Scenario: View all trains when list is long
  Given date "2025-06-20" has 10 services
  And the popup height is limited to 85vh
  When I open the date details popup
  Then the popup content should be scrollable
  And I should be able to scroll to see all 10 trains
```

### Scenario 8.13: Handle partial journeys in popup
```gherkin
Scenario: Display return-only service correctly
  Given train "9320" has return journey only
  When I open the date details popup
  Then the "Outbound (PNO → AMS)" section should show all times as "-"
  And the "Return (AMS → PNO)" section should show actual times
```

---

## Feature 9: Statistics Dashboard

### Scenario 9.1: Display total train count
```gherkin
Feature: Statistics Dashboard
  As a train coordinator
  I want to see aggregate statistics
  So that I can understand the overall dataset health

Scenario: Show count of all services
  Given there are 40 train services in the dataset
  And no filters are applied
  When I view the statistics panel
  Then I should see "Total Trains: 40"
```

### Scenario 9.2: Display total discrepancies count
```gherkin
Scenario: Show count of services with issues
  Given there are 40 train services
  And 7 services have at least one issue
  When I view the statistics panel
  Then I should see "Total Discrepancies: 7"
  And the badge should be red
```

### Scenario 9.3: Display TamTam issues count
```gherkin
Scenario: Show count of TamTam-specific problems
  Given there are 40 train services
  And 2 services have TamTam discrepancies or missing data
  When I view the statistics panel
  Then I should see "TamTam Issues: 2"
  And the badge should be red
```

### Scenario 9.4: Display eRoster issues count
```gherkin
Scenario: Show count of eRoster-specific problems
  Given there are 40 train services
  And 2 services have eRoster discrepancies or missing data
  When I view the statistics panel
  Then I should see "eRoster Issues: 2"
  And the badge should be red
```

```gherkin
Scenario: Show count of ticket sales problems
  Given there are 40 train services
  When I view the statistics panel
  And the badge should be red
```

### Scenario 9.6: Update statistics when filters applied
```gherkin
Scenario: Recalculate metrics for filtered dataset
  Given there are 40 total services with 7 issues
  And the statistics show "Total Trains: 40"
  When I apply a filter showing only 10 services with 3 issues
  Then the statistics should update to "Total Trains: 10"
  And it should show "Total Discrepancies: 3"
```

### Scenario 9.7: Show zero issues with neutral badge
```gherkin
Scenario: Display when no discrepancies exist
  Given there are 40 train services
  And all services are fully verified
  When I view the statistics panel
  Then I should see "Total Discrepancies: 0"
  And the badge should be neutral (not red)
```

### Scenario 9.8: Statistics persist across view modes
```gherkin
Scenario: Maintain statistics when switching views
  Given the statistics show "Total Trains: 40"
  And I am in Grouped view
  When I switch to Calendar view
  Then the statistics should still show "Total Trains: 40"
  And all other metrics should remain the same
```

---

## Feature 10: Responsive Layout Design

### Scenario 10.1: Desktop layout with three columns
```gherkin
Feature: Responsive Layout Design
  As a user on different devices
  I want the layout to adapt to my screen size
  So that I can use the application comfortably

Scenario: View on large desktop screen (1280px+)
  Given I am viewing the application on a 1920px wide screen
  When the page loads
  Then I should see a three-column layout
  And the left sidebar should show filters (320px wide)
  And the center area should show the main data view
  And the right sidebar should show statistics (256px wide)
```

### Scenario 10.2: Tablet layout with stacked sidebars
```gherkin
Scenario: View on tablet screen (768px - 1024px)
  Given I am viewing the application on a 800px wide screen
  When the page loads
  Then the filters and statistics should stack vertically on the left
  And the main data view should be on the right
  And the layout should use two columns
```

### Scenario 10.3: Mobile layout with single column
```gherkin
Scenario: View on mobile screen (below 768px)
  Given I am viewing the application on a 375px wide screen
  When the page loads
  Then the layout should be a single column
  And filters should be at the top
  And the data view should be in the middle
  And statistics should be at the bottom
```

### Scenario 10.4: Horizontal scroll for wide tables on mobile
```gherkin
Scenario: View table on narrow screen
  Given I am viewing the application on a 375px wide screen
  And the table has 15 columns totaling 800px minimum width
  When I view the Spreadsheet view
  Then the table should be horizontally scrollable
  And I should be able to swipe left/right to see all columns
```

### Scenario 10.5: Responsive text sizing
```gherkin
Scenario: Adjust font sizes for different screens
  Given the page title is "Train Service Tracking Tool"
  When I view on a desktop (1024px+)
  Then the title should be displayed at 1.875rem (30px)
  When I view on mobile (below 768px)
  Then the title should be displayed at 1.5rem (24px)
```

---

## Feature 11: Dark Theme Interface

### Scenario 11.1: Display dark background colors
```gherkin
Feature: Dark Theme Interface
  As a user working in low-light environments
  I want a dark color scheme
  So that I can reduce eye strain

Scenario: View page with dark theme
  When I load the application
  Then the main background should be very dark gray (#0a0a0a)
  And card backgrounds should be dark gray (#141414)
  And the theme should be dark by default
```

### Scenario 11.2: Display high-contrast text
```gherkin
Scenario: Read text on dark background
  When I view any text content
  Then primary text should be off-white (#fafafa)
  And the contrast ratio should be at least 18:1
  And text should be easily readable
```

### Scenario 11.3: Display semantic colors
```gherkin
Scenario: Use consistent color palette
  When I view the application
  Then accent colors should be cyan (#00bcd4)
  And error colors should be red (#f44336)
  And muted text should be medium gray (#999999)
```

### Scenario 11.4: Display subtle borders
```gherkin
Scenario: Separate sections with borders
  When I view cards and panels
  Then borders should be subtle gray (#333333)
  And they should provide visual separation without harshness
```

---

## Feature 12: Interactive Controls

### Scenario 12.1: Button hover effect
```gherkin
Feature: Interactive Controls
  As a user interacting with the application
  I want immediate visual feedback
  So that I know my actions are recognized

Scenario: Hover over a button
  Given there is a filter button
  When I move my mouse over the button
  Then the button background should lighten
  And the border should brighten to cyan
  And the transition should be smooth (200ms)
```

### Scenario 12.2: Table row hover effect
```gherkin
Scenario: Hover over a table row
  Given there is a service row in the table
  When I move my mouse over the row
  Then the row background should change to muted gray
  And the cursor should change to pointer
  And the transition should be smooth
```

### Scenario 12.3: Checkbox toggle animation
```gherkin
Scenario: Toggle a régime filter checkbox
  Given the Vendredi checkbox is unchecked
  When I click the checkbox
  Then it should smoothly transition to checked state
  And the checkmark should appear with animation
  And the background should change to accent color
```

### Scenario 12.4: Dropdown selection feedback
```gherkin
Scenario: Select an option from dropdown
  Given the date range dropdown is open
  When I click on "This Week" option
  Then the option should highlight briefly
  And the dropdown should close
  And the selected value should display immediately
```

### Scenario 12.5: Focus indicator for keyboard navigation
```gherkin
Scenario: Navigate with keyboard
  Given I am using keyboard to navigate
  When I press Tab to focus on a button
  Then a visible focus ring should appear around the button
  And the ring should be cyan colored
  And it should have 2px offset from the button edge
```

---

## Feature 13: Visual Hierarchy

### Scenario 13.1: Typography hierarchy
```gherkin
Feature: Visual Hierarchy
  As a user scanning the interface
  I want clear visual organization
  So that I can quickly find information

Scenario: Distinguish heading levels
  When I view the page
  Then the page title should be 3xl size (1.875rem)
  And section headers should be xl size (1.25rem)
  And subsection headers should be lg size (1.125rem)
  And body text should be sm size (0.875rem)
```

### Scenario 13.2: Spacing hierarchy
```gherkin
Scenario: Separate content with consistent spacing
  When I view major sections
  Then they should be separated by 2rem (32px)
  And subsections should be separated by 1rem (16px)
  And related items should be separated by 0.5rem (8px)
```

### Scenario 13.3: Color hierarchy for importance
```gherkin
Scenario: Distinguish content importance by color
  When I view text content
  Then primary content should use foreground color (#fafafa)
  And secondary content should use muted foreground (#999999)
  And highlighted content should use accent color (cyan)
  And error content should use destructive color (red)
```

### Scenario 13.4: Visual weight for emphasis
```gherkin
Scenario: Emphasize important information
  When I view train numbers
  Then they should be displayed in semibold weight
  And issue counts should be displayed in bold weight
  And supporting text should be in normal weight
```

---

## Feature 14: Loading States and Feedback

### Scenario 14.1: Instant filter application
```gherkin
Feature: Loading States and Feedback
  As a user applying filters
  I want immediate feedback
  So that I know the system is responsive

Scenario: Apply date range filter
  Given I am viewing all services
  When I select "This Week" from the date range filter
  Then the data should update instantly (< 100ms)
  And no loading spinner should appear
  And the filtered results should display immediately
```

### Scenario 14.2: Smooth view mode transition
```gherkin
Scenario: Switch between view modes
  Given I am in Grouped view
  When I click on "Calendar" view mode
  Then the content should fade out smoothly
  And the calendar should fade in smoothly
  And the transition should take 200ms
```

### Scenario 14.3: Modal dialog animation
```gherkin
Scenario: Open date details popup
  Given I am in Calendar view
  When I click on a date cell
  Then the popup should fade in
  And it should zoom in slightly (95% to 100% scale)
  And the animation should be smooth
```

### Scenario 14.4: Active state feedback
```gherkin
Scenario: Toggle a filter button
  Given a filter button is inactive
  When I click the button
  Then it should immediately change to active state
  And the background should change to accent color
  And the button should scale up slightly (105%)
```

---

## Feature 15: Data Styling and Visual Indicators

### Scenario 15.1: Display normal time
```gherkin
Feature: Data Styling and Visual Indicators
  As a user viewing schedules
  I want clear visual indicators
  So that I can quickly understand the data

Scenario: Show standard station time
  Given a station time "12:22" with no special flags
  When I view the time in the table
  Then it should be displayed in white text
  And it should use small font size (0.75rem)
  And it should have no special styling
```

### Scenario 15.2: Display border crossing time
```gherkin
Scenario: Highlight international border crossing
  Given a station time "13:18" marked as border crossing
  When I view the time in the table
  Then it should be displayed in red italic text (#f87171 with 70% opacity)
  And it should stand out from normal times
```

### Scenario 15.3: Display changed time
```gherkin
Scenario: Highlight modified schedule time
  Given a station time "20:35" marked as changed
  When I view the time in the table
  Then it should have yellow text (#fbbf24)
  And it should have dark background (#111827)
  And it should have padding and rounded corners
  And it should be medium font weight
```

### Scenario 15.4: Display missing time
```gherkin
Scenario: Show no scheduled stop
  Given a station has no time value
  When I view the station column
  Then it should display "-" in gray text
  And the dash should use muted foreground color
```

### Scenario 15.5: Display OK verification icon
```gherkin
Scenario: Show verified system status
  Given a service has TamTam verified
  When I view the TamTam column
  Then I should see a green checkmark icon
  And the icon should be 1rem (16px) size
```

### Scenario 15.6: Display discrepancy warning icon
```gherkin
Scenario: Show schedule mismatch
  Given a service has eRoster discrepancy
  When I view the eRoster column
  Then I should see a yellow warning triangle icon
  And the icon should be 1rem (16px) size
```

### Scenario 15.7: Display missing data error icon
```gherkin
Scenario: Show missing system data
  Given a service has TamTam missing data
  When I view the TamTam column
  Then I should see a red X icon
  And the icon should be 1rem (16px) size
```

### Scenario 15.8: Display régime color border
```gherkin
Scenario: Identify service régime
  Given a service has "Vendredi" régime
  And Vendredi color is set to magenta (#ec4899)
  When I view the service row
  Then the left border should be 4px wide
  And the border should be magenta colored
```

---

## Summary

This Gherkin test scenario document provides comprehensive coverage for all 15 features of the Train Service Tracking Tool. The scenarios cover:

- **Positive test cases**: Expected behavior under normal conditions
- **Negative test cases**: Handling of missing data and error states
- **Edge cases**: Boundary conditions and unusual data patterns
- **Integration scenarios**: Multiple features working together
- **User interaction flows**: Complete workflows from start to finish

Each scenario follows the standard Gherkin format with clear Given-When-Then steps, making them suitable for:
- **Behavior-Driven Development (BDD)** implementation
- **Automated testing** with tools like Cucumber or Playwright
- **Manual testing** checklists and test plans
- **Requirements validation** and acceptance criteria
- **Documentation** of expected system behavior

The scenarios can be directly used with testing frameworks or serve as a comprehensive specification for quality assurance teams.

---

**End of Document**
