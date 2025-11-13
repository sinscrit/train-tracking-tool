# Project TODO

## Core Features
- [x] Create sample dataset with train services for multiple dates (8 weeks)
- [x] Display reference schedule (régimé) section
- [x] Display actual date sections with train schedules
- [x] Show verification status for TamTam and eRoster systems
- [x] Implement visual indicators for discrepancies (like yellow highlights)
- [x] Add ability to modify Totem+ schedule data
- [x] Add ability to toggle TamTam/eRoster visibility status
- [x] Add ability to simulate schedule mismatches between systems
- [x] Create responsive layout for viewing on different screen sizes

## Data Model
- [x] Define train service data structure
- [x] Include route information (PNO, BRU, AMS stations)
- [x] Model Totem+ transport plan data
- [x] Model TamTam manual representation
- [x] Model eRoster status (with bug simulation for short-term trains)
- [x] Support mixed crew composition (Blue driver, Red train manager)

## UI/UX
- [x] Design table layout similar to Excel spreadsheet
- [x] Color-code different sections and status indicators
- [x] Add interactive controls for data modification
- [x] Show clear visual feedback when data is modified
- [x] Display schedule times in appropriate format

## UI Improvements
- [x] Remove "Actual Service" badge when date is shown
- [x] Remove "Totem+" label from schedule column header
- [x] Add "Simulation Mode" toggle button at top of screen
- [x] Hide Actions column and edit buttons when simulation mode is off
- [x] Hide simulation controls in dialog when simulation mode is off
- [x] Add hover tooltips on discrepancies to show underlying data differences

## Theme Improvements
- [x] Remove "Reference Schedule" badge
- [x] Add theme toggle button (light/dark mode)
- [x] Implement Claude.ai-inspired light mode color scheme
- [x] Make theme switchable in ThemeProvider

## Data Structure Improvements
- [x] Update data model to support station-by-station grid layout
- [x] Add outbound journey columns (PNO → Wannehain → BRU → Hazeldonk → AMS)
- [x] Add return journey columns (AMS → Hazeldonk → BRU → Wannehain → PNO)
- [x] Support trains that only run outbound, return, or both directions
- [x] Add support for highlighting modified times (red/italic)

## UI Updates for Grid Layout
- [x] Update Home page to display station-by-station grid
- [x] Create separate column headers for outbound and return journeys
- [x] Display modified times in red/italic styling
- [x] Update DiscrepancyTooltip to work with new data structure
- [x] Update ServiceDetailDialog to edit station-by-station schedules

## Filtering and Statistics Features
- [x] Change Wannehain (Frandeux) to WNH abbreviation
- [x] Change Hazeldonk (Frandeux) to HDK abbreviation
- [x] Add date range filters (1, 2, 4, 8, 4-8 weeks)
- [x] Add filter for trains with any discrepancies
- [x] Add filter for trains with eRoster discrepancies only
- [x] Add filter for trains with TamTam discrepancies only
- [x] Display total number of trains (based on active filters)
- [x] Display total discrepancies by system (based on active filters)
- [x] Create statistics panel showing counts and breakdowns

## Filter Enhancements
- [x] Add "Clear All Filters" button to reset filters to defaults

## Time Display Corrections
- [x] Change red/italic times to dimmer styling (border crossing indicator)
- [x] Add "changed" flag to StationTime interface for actual schedule changes
- [x] Display changed times with dark background and yellow text
- [x] Update data to distinguish between border crossings and actual changes

## Bug Fixes
- [x] Fix React ref warning in Dialog component (DialogOverlay)

## Time Change Detection
- [x] Auto-detect changed times by comparing against régimé schedule
- [x] Apply "changed" styling automatically when times differ from régimé
- [x] Update handleTimeChange to set changed flag based on comparison

## Display Logic Updates
- [x] Update Home.tsx renderTime to compare against régimé dynamically
- [ ] Update initial data to mark times that differ from régimé with changed flag (not needed - dynamic comparison handles this)

## Critical Bug Fixes
- [x] Fix React Hooks violation in ServiceDetailDialog (useMemo after early return)

## UX Enhancements
- [x] Make service detail dialog draggable/movable
- [x] Add drag handle to dialog header
- [x] Implement drag functionality with mouse events

## Critical Bug Fixes
- [x] Fix React Hooks violation in ServiceDetailDialog (useEffect after early return)

## Accessibility & Warning Fixes
- [x] Add DialogTitle for screen reader accessibility
- [x] Remove unnecessary ref from DialogContent

## Dialog Positioning Fix
- [x] Fix dialog initial position to center in viewport
- [x] Ensure dialog top is not cut off when first opened

## Automatic Discrepancy Detection
- [x] Implement automatic detection of schedule differences between Totem+ and TamTam
- [x] Implement automatic detection of schedule differences between Totem+ and eRoster
- [x] Update TamTam verification status to show warning when times differ from Totem+
- [x] Update eRoster verification status to show warning when times differ from Totem+
- [x] Update data model to represent separate TamTam and eRoster schedules

## Discrepancy Popup Enhancement
- [x] Make discrepancy warning icon clickable
- [x] Create popup dialog showing detailed schedule comparison
- [x] Display only stations with time differences in the popup
- [x] Show Totem+ time vs TamTam/eRoster time side-by-side
- [x] Highlight discrepant times with red background and yellow text
- [x] Format station names with direction (e.g., "PNO (dep)", "BRU (arr)")

## Discrepancy Popup Arrow Direction
- [x] Use left arrow (←) for return journey stations in discrepancy popup
- [x] Keep right arrow (→) for outbound journey stations in discrepancy popup

## Expandable Row Feature
- [x] Add click handler to train rows to toggle expansion
- [x] Create TamTam sub-row showing station-by-station schedule
- [x] Create eRoster sub-row showing station-by-station schedule
- [x] Highlight discrepant times with red background and yellow text in sub-rows
- [x] Use directional arrows (→ outbound, ← return) in sub-rows
- [x] Add "Expand All" button in controls
- [x] Add "Collapse All" button in controls
- [x] Add "Expand Issues Only" button in controls
- [x] Track expanded state for each train row
- [x] Support multiple rows expanded simultaneously

## Expandable Row Simplification
- [x] Remove station labels and arrows from expanded sub-rows
- [x] Display only time values aligned with column headers
- [x] Show discrepant times with red background and yellow text only
- [x] Keep same column layout as main Totem+ row

## Expansion Control & Border Styling Updates
- [x] Move Row Expansion controls to appear just below Régimé section
- [x] Prevent régimé trains from being expandable (no chevron, no click handler)
- [x] Apply red italic styling to border station times (WNH, HDK) in expanded sub-rows

## Missing Data Representation
- [x] Update logic to detect when TamTam has no data while Totem+ has data
- [x] Update logic to detect when eRoster has no data while Totem+ has data
- [x] Show red X in verification column when system has no data
- [x] Display red background with yellow X in expanded sub-rows for missing data
- [x] Update sample data to include cases where eRoster/TamTam have no schedule data

## Fix Missing Data Detection Logic
- [x] Update renderComparisonTime to check if Totem+ has data for specific station before showing X
- [x] Only show yellow X when Totem+ has time but TamTam/eRoster doesn't for that specific station
- [x] Show "-" when both Totem+ and system have no data for that station

## Update Legend Text
- [x] Change "Not Visible (System Bug)" to "Missing data" in legend

## Implement Spreadsheet View
- [x] Add view mode toggle (grouped by date vs spreadsheet)
- [x] Create UI control to switch between views
- [x] Implement spreadsheet layout with date column on left
- [x] Display all trains consecutively without date section headers
- [x] Show single set of station column headers at top
- [x] Support row expansion in spreadsheet view

## Fix Date Display in Spreadsheet View
- [x] Update renderSpreadsheetView to group trains by date
- [x] Use rowspan to make date cell span all trains for that date
- [x] Only render date cell for first train in each date group
- [x] Test that expanded sub-rows don't break the rowspan layout

## Fix Expanded Row Alignment in Spreadsheet View
- [x] Ensure sub-rows have same number of columns as main row for proper alignment
- [x] Test alignment with expanded rows in spreadsheet view

## Add Saturday (Samedi) Régime
- [x] Duplicate Régimé Vendredi data structure to create Régimé Samedi
- [x] Generate Saturday dates corresponding to each Friday date in the data
- [x] Add regime filter state (Vendredi, Samedi) with checkboxes
- [x] Add checkboxes to Régimé tile to toggle Vendredi and Samedi display
- [x] Update display logic to filter trains by selected régimes
- [x] Ensure both grouped and spreadsheet views support regime filtering

## Add Color-Coded Borders for Régimes
- [x] Add logic to determine if a service is Vendredi or Samedi based on date or service_id
- [x] Update ExpandableTrainRow to accept dayOfWeek prop
- [x] Apply pink/magenta left border for Vendredi trains
- [x] Apply orange left border for Samedi trains
- [x] Ensure colors work in both grouped and spreadsheet views
- [x] Test with both régimes enabled and individually

## Fix Régime Filtering
- [x] Update Régimé section to only display trains from checked régimes (hide Vendredi trains if unchecked, hide Samedi trains if unchecked)
- [x] Update actual services sections to only show dates that match checked régimes
- [x] Filter out Friday dates when Vendredi is unchecked
- [x] Filter out Saturday dates when Samedi is unchecked
- [x] Test with only Vendredi checked, only Samedi checked, and both checked

## Add Color Pickers for Régime Colors
- [x] Add state for Vendredi color (default: pink/magenta #ec4899)
- [x] Add state for Samedi color (default: orange #f97316)
- [x] Add color picker input next to Vendredi checkbox
- [x] Add color picker input next to Samedi checkbox
- [x] Pass custom colors to ExpandableTrainRow component
- [x] Update ExpandableTrainRow to use custom colors instead of hardcoded Tailwind classes
- [x] Test color customization in both grouped and spreadsheet views

## Implement Calendar View
- [x] Add "Calendar View" as third view option alongside Grouped and Spreadsheet views
- [x] Create calendar grid component showing month layout (S M T W T F S)
- [x] Display all dates in month including empty days without trains
- [x] Implement status aggregation logic for each date:
  - [x] Otherwise show individual system status: TT ✓/⚠/X, eR ✓/⚠/X, V ✓/⚠
  - [x] ✓ = all trains OK, X = any missing data, ⚠ = any discrepancies
- [x] Add month navigation (automatically shows all months with train services)
- [x] Respect Régime filter (only show dates matching checked Vendredi/Samedi)
- [x] Make calendar read-only (no click interactions on dates)
- [x] Gray out or leave empty days without trains
- [x] Test with different months and régime filter combinations

## Remove Verification Columns from Régimé Section
- [x] Update renderScheduleTable to accept showVerification parameter
- [x] Hide verification checkmarks in Régimé rows
- [x] Keep empty space on right side for alignment with actual services sections

## Fix Column Alignment in Régimé Section
- [x] Revert conditional hiding of verification columns in renderScheduleTable
- [x] Keep verification column headers but make them empty (no text)
- [x] Keep verification cells in ExpandableTrainRow but make them empty (no content)
- [x] Maintain column structure for alignment with actual services sections

## Fix Régimé Section Alignment (Keep Headers Visible)
- [x] Remove checkmark content from verification cells in Régimé rows
- [x] Ensure perfect column alignment between Régimé and actual services sections

## Clickable Calendar Dates with Train Details Popup
- [x] Make calendar date cells clickable in Calendar View
- [x] Create popup/dialog component to show train details for selected date
- [x] Display list of trains with their numbers and verification status (✓/⚠/X)
- [x] Add close button and click-outside-to-close functionality

## Enhance Calendar Date Popup with Full Schedule Details
- [x] Update DateDetailsPopup to show station-by-station schedule for each train
- [x] Display outbound journey times (PNO → WNH → BRU → HDK → AMS)
- [x] Display return journey times (AMS → HDK → BRU → WNH → PNO)
- [x] Keep verification status icons alongside schedule details
- [x] Apply same styling as main table (border crossing times, changed times)

## Documentation - Features List
- [x] Create comprehensive list of all functional features
- [x] Create comprehensive list of all UX features
- [x] Document each feature with clear descriptions

## Documentation - Use Cases
- [x] Create use cases for all functional features
- [x] Create use cases for all UX features
- [x] Document implementation details for each use case
- [x] Include code examples and data flow descriptions

## Documentation - Gherkin Test Scenarios
- [x] Create Gherkin scenarios for all functional features
- [x] Create Gherkin scenarios for all UX features
- [x] Cover positive and negative test cases
- [x] Include edge cases and boundary conditions
- [x] Ensure complete feature coverage

## Documentation - Technology-Agnostic Rebuild Documentation
- [x] Create data model and entity relationship diagrams
- [x] Create system architecture diagrams
- [x] Create business logic and rules documentation
- [x] Create API specification (for future backend implementation)
- [x] Create user journey maps and workflow diagrams
- [x] Create UI component hierarchy and wireframes

## Calendar View Enhancements
- [x] Add colored underlines to day-of-week headers based on régime colors
- [x] Detect schedule changes (Totem+ vs Régimé template) for each date
- [x] Display date numbers with yellow text on black background when schedule changes exist
- [x] Test visual indicators in calendar view

## Calendar Popup Enhancement - Schedule Comparison Columns
- [x] Increase popup width by 20% for better visibility
- [x] Restructure popup layout to show system comparisons side-by-side
- [x] Add TamTam (TT) column showing schedule times for outbound journey
- [x] Add eRoster (eR) column showing schedule times for outbound journey
- [x] Add TamTam (TT) column showing schedule times for return journey
- [x] Add eRoster (eR) column showing schedule times for return journey
- [x] Highlight discrepancies (times that differ from Totem+) with appropriate styling
- [x] Test popup with various trains showing different discrepancy patterns

## Increase Calendar Popup Width
- [x] Increase popup width by additional 20% (from max-w-7xl to max-w-[95vw])
- [x] Test wider popup display with all comparison columns

## Calendar Popup Styling Consistency
- [x] Apply border crossing styling (red/italic) to TamTam and eRoster times in popup
- [x] Apply changed time styling (yellow on black) to TamTam and eRoster times in popup
- [x] Apply discrepancy styling (yellow/orange) to times that differ from Totem+
- [x] Ensure popup styling matches main table views exactly

## Calendar Popup - Red Background for Discrepancies
- [x] Add red background to TamTam cells when time differs from Totem+
- [x] Add red background to eRoster cells when time differs from Totem+
- [x] Match main table discrepancy background styling exactly

## Fix Calendar Popup Width and Station Label Truncation
- [x] Increase popup width to 98vw for maximum space
- [x] Add minimum widths to station label columns (w-24)
- [x] Prevent text wrapping in table cells (whitespace-nowrap)
- [x] Ensure all station names display fully (PNO dep, WNH arr, BRU arr, etc.)

## Fix Popup Width - Override DialogContent Constraints
- [x] Investigate DialogContent default styling (found sm:max-w-lg constraint)
- [x] Apply proper width override (min-w-[1200px] max-w-[98vw] sm:max-w-[98vw])
- [x] Verify popup actually renders at minimum 1200px width

## Adjust Popup Width to Original + 120px
- [x] Remove min-w-[1200px] (too wide)
- [x] Calculate original default width (sm:max-w-lg = 512px)
- [x] Apply width of 632px (512px + 120px)
- [x] Test popup renders at correct width

## Replace Totem+ with T+ in Calendar Popup
- [x] Update Outbound table header from "Totem+" to "T+"
- [x] Update Return table header from "Totem+" to "T+"

## Improve Popup Table Readability
- [x] Replace "arr" with "a" in all station labels
- [x] Replace "dep" with "d" in all station labels
- [x] Reduce padding between station labels and time columns (pr-2 to pr-1, px-2 to px-1)
- [x] Adjust table layout to bring schedule data closer to station names (right-align labels)
- [x] Test readability with abbreviated labels and tighter spacing

## Fix Popup Table Column Spacing
- [x] Reduce station label column width from w-24 to w-14
- [x] Change station labels from right-aligned back to left-aligned
- [x] Verify time columns (T+, TT, eR) have more space and are readable

## Fix Discrepancy Background Overlap in Popup
- [x] Make red background narrower to prevent overlapping adjacent cells (px-2 to px-1)
- [x] Add horizontal padding/margin to constrain background to text width
- [x] Test with various time values to ensure no overlap

## Fix Popup Missing Data Detection (Per-Station)
- [ ] Change renderTime calls to check individual station times instead of overall status
- [ ] Show "X" with red background when Totem+ has time but TamTam/eRoster doesn't
- [ ] Match the logic used in expanded rows (ExpandableTrainRow)
- [ ] Test popup displays X correctly for missing station times



- [x] Remove all 'Mise en vente' monitoring functionality from the application

## Period Management Feature
- [ ] Create Period data structure with name, start date, end date, and régime schedules
- [ ] Update data model to organize train services by period (2025-X1: June 1 - July 25, 2025)
- [ ] Add new period 2025-X2 (Aug 1 - Aug 15, 2025) with no data/schedules
- [ ] Implement Period filter dropdown in main UI
- [ ] Filter train services display based on selected period's date range
- [ ] Update régime display to show period-specific long-term schedules

- [x] Create Period data structure with name, start date, end date, and régime schedules
- [x] Update data model to organize train services by period (2025-X1: June 1 - July 25, 2025)
- [x] Add new period 2025-X2 (Aug 1 - Aug 15, 2025) with no data/schedules
- [x] Implement Period filter dropdown in main UI
- [x] Filter train services display based on selected period's date range
- [x] Update régime display to show period-specific long-term schedules

- [x] Create Period data structure with name, start date, end date, and régime schedules
- [x] Update data model to organize train services by period (2025-X1: June 1 - July 25, 2025)
- [x] Add new period 2025-X2 (Aug 1 - Aug 15, 2025) with no data/schedules
- [x] Implement Period filter dropdown in main UI
- [x] Filter train services display based on selected period's date range
- [x] Update régime display to show period-specific long-term schedules

- [x] Add spacing between Period and Date Range filter columns for better visual separation

- [x] Update Period filter to show only period name when collapsed
- [x] Display period date range below the Period dropdown
- [x] Show two-column layout (Period Name | Period Dates) in expanded dropdown menu

- [x] Move Vendredi and Samedi checkboxes with color pickers from Régimé section to Filters panel

- [x] Make dates more prominent with larger font size and bolder weight in grouped view
- [x] Enhance date visibility in spreadsheet view headers
- [ ] Improve date prominence in calendar view
- [x] Change day names from French (Vendredi, Samedi) to English (Friday, Saturday)

- [x] Add period_id field to TrainService interface
- [x] Assign period_id "2025-X1" to all existing train schedules

- [ ] Update Regime interface to support all 7 days of the week (monday-sunday)
- [ ] Rename existing vendredi/samedi data to friday/saturday in data model
- [ ] Create dynamic day filter rendering based on selectedPeriod.regime available days
- [ ] Update getDayOfWeek function to return lowercase day names (monday-sunday)
- [ ] Update filtering logic to work with all 7 days dynamically
- [ ] Update color assignment to support all days with default colors

- [x] Update Regime interface to support all 7 days of the week (monday-sunday)
- [x] Rename existing vendredi/samedi data to friday/saturday in data model
- [x] Create dynamic day filter rendering based on selectedPeriod.regime available days
- [x] Update getDayOfWeek function to return lowercase day names (monday-sunday)
- [x] Update filtering logic to work with all 7 days dynamically
- [x] Assign random bright colors by default for each day of the week

- [x] Fix missing colored left border in régime schedule table rows

- [x] Add bonus_trains array to Period interface
- [x] Create bonus train 9303 for 2025-07-10 with schedule data
- [x] Add "Bonus Trains" filter checkbox with dark yellow color
- [x] Add "Bonus Trains" statistic to statistics panel
- [x] Update filtering logic to handle bonus trains separately from régime days
- [x] Assign dark yellow color (#ca8a04) to bonus trains by default

- [x] Sort train schedules chronologically by departure time within each date group
- [x] Move Bonus Trains checkbox to same line as weekday filters (Friday, Saturday)
- [x] Remove "Régime" and "Special Trains" section titles to save vertical space

- [ ] Create "Add Bonus Train" button/panel visible only in simulation mode
- [ ] Add CSV text input field with support for tab, comma, and semicolon separators
- [ ] Implement CSV parsing to extract date, train ID, and 12 station times
- [ ] Validate bonus train date falls within selected period
- [ ] Check for duplicate train number on same date
- [ ] Add checkbox option "Copy to TamTam" and "Copy to eRoster"
- [ ] Create new bonus train and add to period's bonus_trains array
- [ ] Show success/error messages for import results

## CSV Bonus Train Import
- [x] Create "Add Bonus Train" button visible only in simulation mode
- [x] Implement CSV parsing with tab, comma, and semicolon separator support
- [x] Validate period dates and check for duplicate train numbers
- [x] Add checkboxes for copying schedule to TamTam and eRoster
- [x] Create bonus train with proper TrainService structure
- [x] Display success/error messages in dialog


## Fix Bonus Train Import Display
- [ ] Fix bonus train import to update periods state so imported trains appear immediately
- [ ] Ensure imported bonus trains display in the train list after import

## Scheduled Train Import Feature
- [ ] Add "Add Scheduled Train" button next to "Add Bonus Train" in simulation mode
- [ ] Create CSV import dialog for scheduled trains
- [ ] Validate that train dates fall on days matching the period's régime (friday/saturday/etc.)
- [ ] Show warning if dates don't match régime days (list incompatible dates and their days)
- [ ] Prevent import if any dates are incompatible with régime
- [ ] Check for duplicate train numbers on same dates in existing schedules
- [ ] Show overwrite warning dialog listing trains that will be replaced
- [ ] Allow user to confirm overwrite or cancel import
- [ ] Update actual_services array with imported scheduled trains
- [ ] Ensure imported scheduled trains appear in the train list after import

- [x] Fix bonus train import to update periods state and trigger re-render
- [x] Create "Add Scheduled Train" button in simulation mode
- [x] Implement CSV parsing for scheduled trains with régime day validation
- [x] Check for duplicate trains and show overwrite warning dialog
- [x] Validate that train dates match available régime days in period
- [x] Add bonus trains and scheduled trains to period state correctly

- [x] Modify scheduled train CSV import to handle grouped date format (date on first line, subsequent rows inherit date until new date found)


## Add/Reset Period Feature
- [ ] Create "Add/Reset Period" button in simulation mode
- [ ] Create dialog with Add/Reset mode switch (default: Add)
- [ ] Add period name, start date, end date inputs (visible in Add mode)
- [ ] Add "Auto Roll-out" toggle switch
- [ ] Add large textarea for CSV data input
- [ ] Implement Step 1: Find first valid import line (starts with weekday name in French/English)
- [ ] Implement Step 2: Parse régime schedule with grouped day format
- [ ] Implement Step 3: Auto roll-out - generate train schedules for all matching weekdays in period
- [ ] Add confirmation dialog showing number of trains to be created by roll-out
- [ ] Implement Step 4: Parse scheduled train dates (grouped date format)
- [ ] Validate scheduled trains - overwrite if on régime day, fail if bonus train conflict
- [ ] Implement Step 5: Create new period or reset existing period data
- [ ] Show success message and update main screen with new/updated period
- [ ] Handle import failures - rollback changes and show error

## Add/Reset Period Feature
- [x] Create Add Period button in simulation mode
- [x] Create Reset Period button in simulation mode
- [x] Design dialog UI with period information inputs (name, start date, end date)
- [x] Add CSV input textarea for schedule data
- [x] Add auto roll-out checkbox option
- [x] Implement CSV parsing utility (parseCSV)
- [x] Implement régime extraction utility (extractRegimeSchedules)
- [x] Implement auto roll-out utility (rolloutRegimeToActualServices)
- [x] Implement scheduled train import utility (importScheduledTrains)
- [x] Create handlePeriodImport function with all 5 steps
- [x] Add validation for period name, dates, and CSV data
- [x] Support both Add Period and Reset Period modes
- [x] Display current period info in Reset Period mode
- [x] Show success/error messages in dialog
- [x] Auto-close dialog after successful import
- [x] Support grouped CSV format (date inheritance)
- [x] Detect and handle duplicate trains (overwrite)
- [x] Update period dropdown after adding new period
- [x] Clear bonus trains when resetting period

## Period Management UI Refactoring
- [x] Replace two buttons (Add Period, Reset Period) with single "Manage Period" button
- [x] Add mode selection inside dialog (radio buttons)
- [x] Support three modes: Add new period, Reset current period, Delete current period
- [x] Show/hide relevant fields based on selected mode
- [x] Implement delete period functionality
- [x] Add confirmation warning for delete action
- [x] Update period dropdown after deletion
- [x] Handle edge case: prevent deletion of last period

## CSV Parser Improvements for Real-World Format
- [x] Update parseCSV to detect first valid day line (first column contains day of week)
- [x] Skip header rows until first valid day line is found
- [x] Support day column as first column instead of date column
- [x] Parse train number from second column
- [x] Parse 12 time columns starting from third column
- [x] Ignore extra columns beyond the 14 expected columns
- [x] Support French day names (Vendredi, Samedi, Lundi, Mardi, Mercredi, Jeudi, Dimanche)
- [x] Handle grouped format where day appears once and subsequent rows inherit the day
- [x] When date appears in first column, use it; when day appears, track current day for inheritance

## Statistics Panel Enhancement
- [x] Add "Bonus Trains" count to Statistics panel
- [x] Display bonus trains count for current period and filters
- [x] Update count when period or filters change

## UI Text Updates
- [x] Change "Manage Period" button text to "Manage Periods" (plural)

## Button Label Updates
- [x] Change "Add Bonus Train" to "Add Bonus"
- [x] Change "Add Scheduled Train" to "Add Scheduled"

## Period Import Bug Fixes
- [x] Fix bonus trains not being imported during period import
- [x] Ensure bonus trains are properly attached to period's bonus_trains array
- [x] Verify bonus trains from scheduled import are identified correctly (trains on days not in régime)

## Bonus Trains Display Issues
- [x] Fix bonus trains showing even when "Bonus Trains" checkbox is unchecked
- [x] Fix bonus trains color to match filter checkbox color (yellow/orange) - changed service_id prefix to 'bonus-'
- [x] Fix statistics count showing 0 instead of actual bonus trains count - now correctly identifies 'bonus-' prefix
- [x] Ensure bonus trains are filtered out when checkbox is unchecked

## Train Display Improvements
- [x] Sort trains by date in chronological order
- [x] Ensure date sorting works for both actual services and bonus trains
