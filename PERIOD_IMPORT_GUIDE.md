# Add/Reset Period Feature Guide

## Overview

The **Add/Reset Period** feature allows users to create new periods or reset existing periods by importing train schedule data from CSV files. This feature automates the process of:

1. Parsing CSV schedule data
2. Extracting régime schedules (weekly templates)
3. Automatically rolling out régime schedules to all dates in the period
4. Importing specific scheduled trains that override rolled-out schedules
5. Creating a new period or updating an existing one

## Accessing the Feature

The feature is only available when **Simulation Mode** is enabled. Two buttons appear in the top section:

- **Add Period**: Creates a new period with imported data
- **Reset Period**: Replaces all data in the current period with imported data

## Dialog Interface

### Period Information Section

- **Period Name**: Unique identifier for the period (e.g., "2025-X3")
  - Editable in Add Period mode
  - Read-only (shows current period) in Reset Period mode
  
- **Start Date**: First date of the period (YYYY-MM-DD format)
  - Editable in Add Period mode
  - Read-only (shows current period) in Reset Period mode
  
- **End Date**: Last date of the period (YYYY-MM-DD format)
  - Editable in Add Period mode
  - Read-only (shows current period) in Reset Period mode

### CSV Input Section

Paste your train schedule data in CSV format. The system supports:

- **Separators**: Tab, comma, or semicolon
- **Date formats**: YYYY-MM-DD
- **Two CSV formats**:
  1. **Standard format**: Date in every row
  2. **Grouped format**: Date on first row, subsequent rows inherit the date

#### CSV Column Structure

```
Date, Train, PNO_dep, WNH_arr, BRU_arr, BRU_dep, HDK_arr, AMS_arr, AMS_dep, HDK_arr, BRU_arr, BRU_dep, WNH_arr, PNO_arr, Day
```

**Columns (14 total + optional Day column):**
1. **Date**: Service date (YYYY-MM-DD) - can be empty in grouped format
2. **Train**: Train number (e.g., "9320", "9339")
3-8. **Outbound journey times**: PNO_dep, WNH_arr, BRU_arr, BRU_dep, HDK_arr, AMS_arr
9-14. **Return journey times**: AMS_dep, HDK_arr, BRU_arr, BRU_dep, WNH_arr, PNO_arr
15. **Day** (optional): Day of week (e.g., "Friday", "Saturday")

**Time format**: Use "-" or leave empty for stations not served

#### Example CSV (Standard Format)

```csv
Date,Train,PNO_dep,WNH_arr,BRU_arr,BRU_dep,HDK_arr,AMS_arr,AMS_dep,HDK_arr,BRU_arr,BRU_dep,WNH_arr,PNO_arr,Day
2025-08-01,9320,06:18,-,08:26,08:28,09:15,10:15,11:00,11:47,12:42,12:44,-,14:52,Friday
2025-08-01,9339,10:04,-,12:12,12:14,13:01,14:01,15:00,15:47,16:42,16:44,-,18:52,Friday
2025-08-02,9320,06:18,-,08:26,08:28,09:15,10:15,11:00,11:47,12:42,12:44,-,14:52,Saturday
```

#### Example CSV (Grouped Format)

```csv
Date,Train,PNO_dep,WNH_arr,BRU_arr,BRU_dep,HDK_arr,AMS_arr,AMS_dep,HDK_arr,BRU_arr,BRU_dep,WNH_arr,PNO_arr,Day
2025-08-01,9320,06:18,-,08:26,08:28,09:15,10:15,11:00,11:47,12:42,12:44,-,14:52,Friday
,9339,10:04,-,12:12,12:14,13:01,14:01,15:00,15:47,16:42,16:44,-,18:52,Friday
2025-08-02,9320,06:18,-,08:26,08:28,09:15,10:15,11:00,11:47,12:42,12:44,-,14:52,Saturday
,9339,10:04,-,12:12,12:14,13:01,14:01,15:00,15:47,16:42,16:44,-,18:52,Saturday
```

### Auto Roll-out Option

**Checkbox**: "Automatically roll out régime schedules to all dates in period"

- **Enabled (default)**: The system will:
  1. Extract unique trains per day of week from CSV to create régime templates
  2. Generate actual services for ALL dates in the period based on the régime
  3. Override rolled-out services with specific dated trains from CSV
  
- **Disabled**: The system will:
  1. Extract régime templates from CSV
  2. Import ONLY the specific dated trains from CSV (no automatic roll-out)

**When to enable**: Use when your CSV contains sample data for a few dates, and you want the system to automatically create services for all dates in the period.

**When to disable**: Use when your CSV contains the complete list of all trains for all dates, and you don't want automatic generation.

## How It Works: The 5-Step Process

### Step 1: Parse CSV Data

The system reads your CSV input and validates:
- Column count (minimum 13 columns required)
- Date format (YYYY-MM-DD)
- Grouped format support (date inheritance)
- Day of week extraction (from "Day" column or calculated from date)

**Error handling**: Invalid format, missing dates, or incorrect column count will show an error message.

### Step 2: Import Régime Schedules

The system extracts **régime schedules** (weekly templates):
- Groups trains by day of week (Monday-Sunday)
- For each day, identifies unique trains
- Creates template schedules for each train
- Stores templates in the period's `regime` object

**Example**: If your CSV has train 9320 on multiple Fridays with the same times, the system creates ONE Friday régime template for train 9320.

### Step 3: Auto Roll-out (if enabled)

The system generates actual services:
- Iterates through every date in the period (start to end)
- For each date, determines the day of week
- Finds the régime template for that day
- Creates actual service records for all trains in the régime
- Assigns unique service IDs (e.g., "actual-9320-2025-08-01")

**Result**: If you have Friday and Saturday régimes, and your period spans 30 days, the system will create services for all Fridays and Saturdays in that range.

### Step 4: Import Scheduled Trains

The system imports specific dated trains from CSV:
- Reads all rows with dates
- Creates actual service records for each row
- **Overrides** rolled-out services if the same train exists on the same date
- Tracks which trains were overwritten

**Use case**: If the rolled-out schedule has train 9320 at 06:18 on 2025-08-15, but your CSV has it at 06:30 on that date, the CSV version will override the rolled-out version.

### Step 5: Create or Update Period

**Add Period mode**:
- Creates a new Period object with:
  - Unique ID (period name)
  - Start and end dates
  - Régime schedules
  - Actual services (rolled-out + scheduled)
  - Empty bonus trains array
- Adds the period to the periods list
- Switches to the new period in the UI

**Reset Period mode**:
- Updates the current period with:
  - New régime schedules (replaces old)
  - New actual services (replaces old)
  - Clears bonus trains
- Keeps the same period ID, name, and date range

## Validation and Error Handling

### Add Period Mode Validations

1. **Period name required**: Must enter a non-empty period name
2. **Dates required**: Both start and end dates must be selected
3. **Date range valid**: End date must be after start date
4. **Unique period**: Period name must not already exist
5. **CSV required**: Must paste CSV data

### Reset Period Mode Validations

1. **CSV required**: Must paste CSV data
2. **Period info read-only**: Cannot change name or dates

### CSV Validations

1. **Column count**: Minimum 13 columns (14 with optional Day column)
2. **Date format**: YYYY-MM-DD format required
3. **First row date**: In grouped format, first row must have a date
4. **Day of week**: If provided, must be valid (Monday-Sunday)

### Error Messages

All errors are displayed in a red alert box at the bottom of the dialog:
- "Please enter a period name"
- "Please select start and end dates"
- "End date must be after start date"
- "Period \"2025-X3\" already exists"
- "Please paste CSV data"
- "Invalid format: Expected at least 13 columns, got 10"
- "Invalid date format: 2025-13-01. Use YYYY-MM-DD"
- "First row must contain a date"
- "Invalid day: Funday"

## Success Workflow

1. User clicks "Add Period" or "Reset Period" button
2. Dialog opens with appropriate mode
3. User fills in period information (Add mode only)
4. User pastes CSV data
5. User enables/disables auto roll-out as needed
6. User clicks "Add Period" or "Reset Period" button
7. System processes the 5 steps
8. Success message appears in green alert box
9. Dialog closes after 2 seconds
10. New/updated period is visible in the UI
11. Period dropdown updates (Add mode only)

## Tips and Best Practices

### Creating a New Period

1. **Prepare your CSV**: Export train schedules from your source system
2. **Choose a naming convention**: Use consistent period names (e.g., "2025-X1", "2025-X2")
3. **Set date range**: Ensure start and end dates match your operational period
4. **Enable auto roll-out**: If your CSV has sample data for a few dates
5. **Review régime days**: Check which days have régime schedules after import

### Resetting an Existing Period

1. **Backup consideration**: Resetting clears all existing data and bonus trains
2. **Use for corrections**: Reset when you need to fix régime schedules
3. **CSV completeness**: Include all trains you want in the period
4. **Auto roll-out**: Usually enabled to regenerate all dates

### Working with Grouped CSV Format

1. **Easier to read**: Group multiple trains under one date heading
2. **Less repetition**: Don't need to repeat the date for each train
3. **Excel-friendly**: Easier to prepare in Excel with merged cells
4. **Example**:
   ```
   2025-08-01,9320,...,Friday
   ,9339,...,Friday
   ,9376,...,Friday
   2025-08-02,9320,...,Saturday
   ```

### Understanding Auto Roll-out

**Scenario 1**: You have 4 trains that run every Friday and Saturday
- CSV: Include those 4 trains for one Friday and one Saturday
- Auto roll-out: Enabled
- Result: System creates those 4 trains for ALL Fridays and Saturdays in the period

**Scenario 2**: You have a complex schedule with different trains on different dates
- CSV: Include every train for every date
- Auto roll-out: Disabled
- Result: System imports exactly what's in the CSV, nothing more

**Scenario 3**: Most trains follow a pattern, but some dates are special
- CSV: Include pattern trains for one occurrence of each day, PLUS all special date trains
- Auto roll-out: Enabled
- Result: System rolls out the pattern, then overrides special dates with CSV data

## Technical Details

### Data Structures

**Régime**: Weekly template schedules
```typescript
{
  friday: [TrainService, TrainService, ...],
  saturday: [TrainService, TrainService, ...]
}
```

**Actual Services**: Dated train services
```typescript
[
  { service_id: "actual-9320-2025-08-01", date: "2025-08-01", ... },
  { service_id: "actual-9339-2025-08-01", date: "2025-08-01", ... },
  ...
]
```

### Service ID Patterns

- **Régime**: `regime-{day}-{train}` (e.g., "regime-friday-9320")
- **Actual**: `actual-{train}-{date}` (e.g., "actual-9320-2025-08-01")
- **Bonus**: `bonus-{train}-{date}` (e.g., "bonus-9303-2025-07-10")

### System Status

All imported trains have:
- **Totem+ status**: "Automatically_Created"
- **TamTam status**: "Automatically_Created"
- **eRoster status**: "Automatically_Created"
- **Verification**: tam_tam_ok: true, e_roster_ok: true

This means imported trains start with all systems in sync. You can later use the simulation mode to introduce discrepancies.

## Troubleshooting

### "Invalid format: Expected at least 13 columns"

**Cause**: CSV doesn't have enough columns
**Solution**: Ensure your CSV has all required columns (Date, Train, 12 time columns)

### "First row must contain a date"

**Cause**: Using grouped format but first row has no date
**Solution**: Put the date in the first row of each group

### "Period already exists"

**Cause**: Trying to add a period with a name that's already used
**Solution**: Choose a different period name or use Reset Period instead

### "End date must be after start date"

**Cause**: Selected end date is before or equal to start date
**Solution**: Select an end date that comes after the start date

### Dialog closes immediately after clicking button

**Cause**: Validation error occurred
**Solution**: Check the error message displayed in the red alert box

### Trains not appearing after import

**Cause**: Auto roll-out disabled and CSV only has sample data
**Solution**: Enable auto roll-out or include all dates in CSV

### Wrong number of trains created

**Cause**: Auto roll-out creating duplicates or missing trains
**Solution**: Check your CSV for duplicate train numbers on the same day

## Example Workflow

### Creating Period 2025-X3 (August 1-31, 2025)

1. Click "Add Period" button
2. Enter period name: "2025-X3"
3. Select start date: 2025-08-01
4. Select end date: 2025-08-31
5. Paste CSV with trains for 2025-08-01 (Friday) and 2025-08-02 (Saturday)
6. Enable auto roll-out
7. Click "Add Period"
8. System creates:
   - Friday régime with trains from 2025-08-01
   - Saturday régime with trains from 2025-08-02
   - Actual services for all Fridays in August (1, 8, 15, 22, 29)
   - Actual services for all Saturdays in August (2, 9, 16, 23, 30)
9. Success message: "Successfully created period "2025-X3" with 2 régime day(s) and 40 actual service(s)"
10. Dialog closes
11. Period "2025-X3" appears in period dropdown

## Related Features

- **Add Bonus Train**: Add individual non-regularly scheduled trains
- **Add Scheduled Train**: Add individual trains with régime validation
- **Period Filter**: Switch between different periods
- **Régime Day Filters**: Show/hide specific days of the week
- **Simulation Mode**: Required to access import features

## API Reference

### Utility Functions

**parseCSV(csvInput: string): ParsedRow[]**
- Parses CSV text into structured row objects
- Supports tab, comma, and semicolon separators
- Handles grouped format with date inheritance
- Validates column count and date format

**extractRegimeSchedules(parsedRows: ParsedRow[]): Regime**
- Groups trains by day of week
- Creates template schedules for each unique train per day
- Returns Regime object with day-indexed train arrays

**rolloutRegimeToActualServices(regime: Regime, startDate: string, endDate: string, periodId: string): TrainService[]**
- Iterates through all dates in range
- Creates actual services based on day's régime
- Returns array of actual service objects

**importScheduledTrains(parsedRows: ParsedRow[], periodId: string, existingServices: TrainService[]): { services: TrainService[], overwritten: string[] }**
- Creates actual services from CSV rows
- Detects duplicates with existing services
- Returns imported services and list of overwritten trains
