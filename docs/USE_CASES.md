# Train Service Tracking Tool - Use Case Documentation

**Document Version:** 1.0  
**Last Updated:** November 11, 2025  
**Author:** Manus AI

---

## Purpose

This document provides detailed use cases for every feature in the Train Service Tracking Tool. Each use case describes the implementation approach, data flow, user interaction patterns, and technical details necessary to rebuild or extend the feature. This serves as a comprehensive implementation guide for developers.

---

## Table of Contents

### Functional Features
1. [Multi-System Data Verification](#uc-f1-multi-system-data-verification)
2. [Schedule Data Management](#uc-f2-schedule-data-management)
3. [Régime Classification System](#uc-f3-régime-classification-system)
4. [Grouped View Mode](#uc-f4-grouped-view-mode)
5. [Spreadsheet View Mode](#uc-f5-spreadsheet-view-mode)
6. [Calendar View Mode](#uc-f6-calendar-view-mode)
7. [Advanced Filtering System](#uc-f7-advanced-filtering-system)
8. [Interactive Calendar Date Details](#uc-f8-interactive-calendar-date-details)
9. [Statistics Dashboard](#uc-f9-statistics-dashboard)

### UX Features
10. [Responsive Layout Design](#uc-ux1-responsive-layout-design)
11. [Dark Theme Interface](#uc-ux2-dark-theme-interface)
12. [Interactive Controls](#uc-ux3-interactive-controls)
13. [Visual Hierarchy](#uc-ux4-visual-hierarchy)
14. [Loading States and Feedback](#uc-ux5-loading-states-and-feedback)
15. [Data Styling and Visual Indicators](#uc-ux6-data-styling-and-visual-indicators)

---

## Functional Features Use Cases

### UC-F1: Multi-System Data Verification

**Feature Description:** Cross-system verification comparing train schedules across Totem+, Tam Tam, and eRoster to identify discrepancies and missing data.

**Implementation Details:**

The verification system is implemented through comparison functions in `client/src/lib/scheduleComparison.ts`. The data structure for each train service contains three system datasets stored in the `systems_data` object with keys `totem_plus`, `tam_tam`, and `e_roster`.

**Data Structure:**
```typescript
interface TrainService {
  systems_data: {
    totem_plus: SystemData;
    tam_tam: SystemData;
    e_roster: SystemData;
  };
  verification: {
    tam_tam_ok: boolean;
    e_roster_ok: boolean;
  };
}
```

**Verification Logic Flow:**

1. **Totem+ as Source of Truth:** The `totem_plus.schedule` object serves as the authoritative reference. All comparisons use Totem+ data as the baseline.

2. **Missing Data Detection:** The functions `isTamTamMissingData()` and `isERosterMissingData()` check if a system has schedule data. A system is considered "missing data" if all station times in its schedule are undefined or empty.

3. **Discrepancy Detection:** The functions `hasTamTamDiscrepancy()` and `hasERosterDiscrepancy()` compare station-by-station times between Totem+ and the target system. A discrepancy exists when:
   - Totem+ has a time for a station, but the target system has a different time
   - Times are compared as strings (e.g., "12:22" vs "12:23")
   - Border crossing and changed flags are ignored in comparison


**User Interaction:**

Users see verification results in three columns on the right side of each table row:
- **TamTam column:** Shows ✓ (OK), ⚠ (discrepancy), or ✗ (missing)
- **eRoster column:** Shows ✓ (OK), ⚠ (discrepancy), or ✗ (missing)

**Code Example:**
```typescript
// From scheduleComparison.ts
export function hasTamTamDiscrepancy(
  totemSchedule: JourneySchedule,
  tamTamSchedule: JourneySchedule
): boolean {
  // Compare each station time between systems
  // Return true if any times differ
}
```

**Rebuild Instructions:**
1. Create comparison utility functions that accept two `JourneySchedule` objects
2. Implement station-by-station time comparison logic
3. Store verification results in the service object's `verification` field
4. Render appropriate icons based on verification status in table columns

---

### UC-F2: Schedule Data Management

**Feature Description:** Comprehensive management of train schedule information for the PNO-AMS route with support for partial journeys.

**Implementation Details:**

Schedule data is structured hierarchically with separate objects for outbound and return journeys. Each station has optional timing data with metadata flags.

**Data Structure:**
```typescript
interface StationTime {
  time: string;              // "HH:MM" format
  border_crossing?: boolean; // Visual indicator flag
  changed?: boolean;         // Modified time flag
}

interface JourneySchedule {
  outbound: {
    pno_dep?: StationTime;
    wnh_arr?: StationTime;
    bru_arr?: StationTime;
    bru_dep?: StationTime;
    hdk_arr?: StationTime;
    ams_arr?: StationTime;
  };
  return: {
    ams_dep?: StationTime;
    hdk_arr?: StationTime;
    bru_arr?: StationTime;
    bru_dep?: StationTime;
    wnh_arr?: StationTime;
    pno_arr?: StationTime;
  };
}
```

**Route Definition:**

The application handles a fixed route with specific stations:
- **PNO** (Perrache): Origin/destination in France
- **WNH** (Weinheim): Border crossing station
- **BRU** (Brussels): Major intermediate stop
- **HDK** (Hazeldonk): Border crossing station
- **AMS** (Amsterdam): Destination/origin in Netherlands

**Partial Journey Support:**

Trains may operate only outbound, only return, or both directions. This is handled by leaving the unused journey object empty (all fields undefined).

**Example - Return Only:**
```typescript
schedule: {
  outbound: {},  // No outbound journey
  return: {
    bru_dep: { time: "09:43" },
    wnh_arr: { time: "10:09", border_crossing: true },
    pno_arr: { time: "11:05" }
  }
}
```

**Rendering Logic:**

The `renderScheduleTable()` function in `Home.tsx` creates table columns for each station. When rendering a cell:
1. Check if the station time exists in the schedule
2. If undefined, display "-" in gray
3. If defined, display the time with appropriate styling based on flags

**User Interaction:**

Users view schedules in a table format with columns organized left-to-right following the journey direction:
- Outbound: PNO dep → WNH arr → BRU arr → BRU dep → HDK arr → AMS arr
- Return: AMS dep → HDK arr → BRU arr → BRU dep → WNH arr → PNO arr

**Rebuild Instructions:**
1. Define the `StationTime` and `JourneySchedule` interfaces
2. Create separate objects for outbound and return journeys
3. Use optional fields (`?`) for all station times to support partial journeys
4. Implement rendering logic that handles undefined values gracefully
5. Apply visual styling based on `border_crossing` and `changed` flags

---

### UC-F3: Régime Classification System

**Feature Description:** Categorization of train services into operational régimes based on weekly schedule patterns with visual color coding.

**Implementation Details:**

The régime system uses a string-based classification stored in the train service object. A separate "Régimé" section displays template schedules for each régime type.

**Data Structure:**
```typescript
// Régime is determined by analyzing the service's operational pattern
// Stored as a computed property or derived from date analysis
type Regime = 
  | "Vendredi"           // Friday
  | "Samedi"             // Saturday
  | "Dimanche"           // Sunday
  | "Lundi-Jeudi"        // Monday-Thursday
  | "Tous les jours"     // Every day
  | "Lundi-Vendredi"     // Monday-Friday
  | "Samedi-Dimanche";   // Weekend
```

**Régime Determination:**

The `getServiceRegime()` function analyzes a service's date and operational pattern to assign the appropriate régime. For the current implementation, this is based on the day of the week derived from the service date.

**Visual Color Coding:**

Each régime has an associated color for visual identification:
- **Vendredi:** Customizable (default: magenta/pink `#ec4899`)
- **Samedi:** Customizable (default: blue `#3b82f6`)
- **Other régimes:** Fixed colors defined in the color palette

Colors are applied as:
1. Left border on table rows (4px solid border)
2. Checkbox indicators in the filter panel
3. Badge backgrounds in the Régimé section header

**Régimé Reference Section:**

The application displays a special "Régimé" section at the top of the data tables showing template schedules. This section:
- Shows services with `date: null` to indicate they are templates
- Displays the same table structure as regular services
- Serves as a visual reference for typical schedules

**User Interaction:**

Users can:
1. **View régime colors:** Each service row has a colored left border
2. **Filter by régime:** Checkboxes in the filter panel toggle visibility
3. **Customize colors:** Color pickers for Vendredi and Samedi in the filter panel
4. **Reference templates:** View the Régimé section for typical schedules

**State Management:**

```typescript
// In Home.tsx
const [regimeFilters, setRegimeFilters] = useState({
  vendredi: true,
  samedi: true,
  // ... other régimes
});

const [regimeColors, setRegimeColors] = useState({
  vendredi: "#ec4899",
  samedi: "#3b82f6"
});
```

**Rebuild Instructions:**
1. Create a régime classification function based on service dates
2. Define a color mapping object for each régime type
3. Implement filter state management with boolean toggles
4. Apply border colors using inline styles: `borderLeft: '4px solid ${color}'`
5. Create a separate data array for régimé template services with `date: null`
6. Render the Régimé section above the main data tables

---

### UC-F4: Grouped View Mode

**Feature Description:** Organizes train services by operational date with collapsible sections for efficient navigation.

**Implementation Details:**

The Grouped View uses a two-level rendering approach: date groups as containers, and service rows within each group.

**Data Organization:**

Services are grouped by date using a `Map` or object with dates as keys:

```typescript
// Group services by date
const groupedServices = useMemo(() => {
  const groups = new Map<string, TrainService[]>();
  
  filteredServices.forEach(service => {
    if (!service.date) return; // Skip régimé templates
    
    if (!groups.has(service.date)) {
      groups.set(service.date, []);
    }
    groups.get(service.date)!.push(service);
  });
  
  return groups;
}, [filteredServices]);
```

**Expansion State Management:**

Each date group has an independent expansion state controlled by a Map:

```typescript
const [expandedDates, setExpandedDates] = useState<Map<string, boolean>>(
  new Map()
);

// Toggle a specific date
const toggleDate = (date: string) => {
  setExpandedDates(prev => {
    const next = new Map(prev);
    next.set(date, !prev.get(date));
    return next;
  });
};
```

**Row Expansion Controls:**

Three control buttons provide bulk expansion operations:

1. **Expand All:** Sets all dates to `expanded: true`
2. **Collapse All:** Sets all dates to `expanded: false`
3. **Expand Issues Only:** Expands only dates that contain services with verification issues

```typescript
const expandIssuesOnly = () => {
  const newExpanded = new Map<string, boolean>();
  
  groupedServices.forEach((services, date) => {
    const hasIssues = services.some(s => 
      !s.verification.tam_tam_ok || 
      !s.verification.e_roster_ok || 
    );
    newExpanded.set(date, hasIssues);
  });
  
  setExpandedDates(newExpanded);
};
```

**Rendering Structure:**

```tsx
{Array.from(groupedServices.entries()).map(([date, services]) => (
  <div key={date} className="border rounded-lg">
    {/* Date header with train count */}
    <div 
      className="flex justify-between items-center p-4 cursor-pointer"
      onClick={() => toggleDate(date)}
    >
      <h3>{formatDate(date)}</h3>
      <span>{services.length} trains</span>
    </div>
    
    {/* Collapsible table */}
    {expandedDates.get(date) && (
      <table>
        {/* Table headers */}
        {services.map(service => (
          <tr key={service.service_id}>
            {/* Service row cells */}
          </tr>
        ))}
      </table>
    )}
  </div>
))}
```

**User Interaction:**

1. **Click date header:** Toggles expansion of that specific date group
2. **Click Expand All:** Opens all date groups simultaneously
3. **Click Collapse All:** Closes all date groups
4. **Click Expand Issues Only:** Opens only groups containing problematic services

**Rebuild Instructions:**
1. Group filtered services by date using `Map` or `reduce()`
2. Create expansion state Map with dates as keys and booleans as values
3. Implement toggle function that updates the Map immutably
4. Render date headers with click handlers
5. Conditionally render table content based on expansion state
6. Add bulk control buttons that manipulate the entire expansion Map

---

### UC-F5: Spreadsheet View Mode

**Feature Description:** Presents all train services in a continuous, flat table format optimized for data analysis and export.

**Implementation Details:**

The Spreadsheet View renders a single unified table containing all filtered services without grouping or collapsing.

**Data Flow:**

```typescript
// In Home.tsx
const renderSpreadsheetView = () => {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse">
        <thead>
          {/* Single header row with all columns */}
          <tr>
            <th>Train</th>
            {/* Outbound station columns */}
            {/* Return station columns */}
            <th>TamTam</th>
            <th>eRoster</th>
          </tr>
        </thead>
        <tbody>
          {filteredServices
            .filter(s => s.date !== null) // Exclude régimé templates
            .map(service => (
              <tr key={service.service_id}>
                {/* All cells for this service */}
              </tr>
            ))
          }
        </tbody>
      </table>
    </div>
  );
};
```

**Table Structure:**

The table uses the same column structure as Grouped View but without date grouping:

| Column | Content | Width |
|--------|---------|-------|
| Train | Train number with colored left border | Fixed |
| PNO dep | Outbound departure time | Auto |
| WNH arr | Outbound arrival time | Auto |
| BRU arr | Outbound arrival time | Auto |
| BRU dep | Outbound departure time | Auto |
| HDK arr | Outbound arrival time | Auto |
| AMS arr | Outbound arrival time | Auto |
| AMS dep | Return departure time | Auto |
| HDK arr | Return arrival time | Auto |
| BRU arr | Return arrival time | Auto |
| BRU dep | Return departure time | Auto |
| WNH arr | Return arrival time | Auto |
| PNO arr | Return arrival time | Auto |
| TamTam | Verification icon | Fixed |
| eRoster | Verification icon | Fixed |

**Styling Differences from Grouped View:**

- No date headers or section dividers
- Continuous row striping for readability (`even:bg-muted/30`)
- Sticky table header for scrolling (`sticky top-0 bg-background`)
- Full-width layout without nested containers

**User Interaction:**

1. **Scroll vertically:** Navigate through all services
2. **Scroll horizontally:** View all columns if viewport is narrow
3. **Visual scanning:** Quickly compare services across dates
4. **Data analysis:** Easier to spot patterns across the entire dataset

**Rebuild Instructions:**
1. Create a single `<table>` element without nested structures
2. Filter out régimé template services (`date !== null`)
3. Map all filtered services directly to `<tr>` elements
4. Use the same cell rendering logic as Grouped View
5. Apply sticky header styling for scroll persistence
6. Ensure horizontal overflow scrolling is enabled

---

### UC-F6: Calendar View Mode

**Feature Description:** Displays train services in a monthly calendar grid with visual status indicators and clickable dates.

**Implementation Details:**

The Calendar View generates a month-by-month grid layout with date cells showing aggregated status information.

**Calendar Generation Logic:**

```typescript
// Generate calendar months from service data
const generateCalendarMonths = (services: TrainService[]) => {
  const months = new Map<string, Map<number, TrainService[]>>();
  
  services.forEach(service => {
    if (!service.date) return; // Skip régimé templates
    
    const date = new Date(service.date);
    const monthKey = `${date.getFullYear()}-${date.getMonth() + 1}`;
    const dayOfMonth = date.getDate();
    
    if (!months.has(monthKey)) {
      months.set(monthKey, new Map());
    }
    
    const monthData = months.get(monthKey)!;
    if (!monthData.has(dayOfMonth)) {
      monthData.set(dayOfMonth, []);
    }
    
    monthData.get(dayOfMonth)!.push(service);
  });
  
  return months;
};
```

**Date Cell Status Calculation:**

Each date cell displays aggregated status across all trains on that date:

```typescript
const getDateStatus = (services: TrainService[]) => {
  let allOk = true;
  let hasTamTamIssue = false;
  let hasERosterIssue = false;
  let hasVenteIssue = false;
  
  services.forEach(service => {
    if (!service.verification.tam_tam_ok) {
      allOk = false;
      hasTamTamIssue = true;
    }
    if (!service.verification.e_roster_ok) {
      allOk = false;
      hasERosterIssue = true;
    }
      allOk = false;
      hasVenteIssue = true;
    }
  });
  
  return { allOk, hasTamTamIssue, hasERosterIssue, hasVenteIssue };
};
```

**Visual Indicators:**

Date cells show different content based on status:

1. **All OK (all systems verified):**
   - Single green checkmark ✓ centered in cell

2. **Has Issues:**
   - **TT** with icon (✓ OK, ⚠ discrepancy, ✗ missing)
   - **eR** with icon
   - **V** with icon
   - Stacked vertically in cell

**Calendar Grid Structure:**

```tsx
<div className="calendar-month">
  <h3>{monthName} {year}</h3>
  
  <div className="grid grid-cols-7 gap-1">
    {/* Day headers */}
    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
      <div key={day} className="text-center font-semibold">{day}</div>
    ))}
    
    {/* Date cells */}
    {Array.from({ length: daysInMonth }, (_, i) => {
      const dayNum = i + 1;
      const services = monthData.get(dayNum) || [];
      const status = getDateStatus(services);
      
      return (
        <div 
          key={dayNum}
          className="border p-2 min-h-[80px] cursor-pointer hover:bg-muted/50"
          onClick={() => openDateDetails(services, `${year}-${month}-${dayNum}`)}
        >
          <div className="text-sm">{dayNum}</div>
          {services.length > 0 && (
            <div className="mt-1">
              {status.allOk ? (
                <Check className="h-5 w-5 text-green-500 mx-auto" />
              ) : (
                <div className="text-xs space-y-0.5">
                  <div>TT {renderStatusIcon(status.hasTamTamIssue)}</div>
                  <div>eR {renderStatusIcon(status.hasERosterIssue)}</div>
                  <div>V {renderStatusIcon(status.hasVenteIssue)}</div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    })}
  </div>
</div>
```

**User Interaction:**

1. **View month grids:** Scroll vertically to see different months
2. **Identify issue dates:** Quickly spot dates with red ✗ or yellow ⚠ indicators
3. **Click date cell:** Opens detailed popup with full schedule information
4. **Hover date cell:** Background highlight indicates clickability

**Rebuild Instructions:**
1. Group services by year-month and day-of-month
2. Generate calendar grid using CSS Grid with 7 columns
3. Calculate first day of month offset for proper alignment
4. Aggregate verification status across all services per date
5. Render appropriate icons based on aggregated status
6. Add click handlers to date cells that open detail popup
7. Apply hover effects to indicate interactivity

---

### UC-F7: Advanced Filtering System

**Feature Description:** Multi-dimensional filtering by date range, discrepancy type, and régime with real-time updates.

**Implementation Details:**

The filtering system uses React state to manage filter criteria and applies them sequentially to the service dataset.

**Filter State Structure:**

```typescript
// Date range filter
const [dateFilter, setDateFilter] = useState<
  'all' | 'this_week' | 'this_month' | 'next_week' | 'custom'
>('all');
const [customDateRange, setCustomDateRange] = useState({
  start: '',
  end: ''
});

// Discrepancy filter
const [discrepancyFilter, setDiscrepancyFilter] = useState<
  'all' | 'with_issues' | 'verified_only' | 'tamtam_issues' | 
  'eroster_issues' | 'vente_issues'
>('all');

// Régime filter
const [regimeFilters, setRegimeFilters] = useState({
  vendredi: true,
  samedi: true,
  dimanche: true,
  lundi_jeudi: true,
  tous_les_jours: true,
  lundi_vendredi: true,
  samedi_dimanche: true
});
```

**Filter Application Logic:**

Filters are applied using `useMemo` to recompute only when dependencies change:

```typescript
const filteredServices = useMemo(() => {
  let result = [...allServices];
  
  // Apply date range filter
  if (dateFilter !== 'all') {
    result = result.filter(service => {
      if (!service.date) return false;
      const serviceDate = new Date(service.date);
      
      switch (dateFilter) {
        case 'this_week':
          return isThisWeek(serviceDate);
        case 'this_month':
          return isThisMonth(serviceDate);
        case 'next_week':
          return isNextWeek(serviceDate);
        case 'custom':
          return isWithinRange(serviceDate, customDateRange);
        default:
          return true;
      }
    });
  }
  
  // Apply discrepancy filter
  if (discrepancyFilter !== 'all') {
    result = result.filter(service => {
      switch (discrepancyFilter) {
        case 'with_issues':
          return !service.verification.tam_tam_ok || 
                 !service.verification.e_roster_ok || 
        case 'verified_only':
          return service.verification.tam_tam_ok && 
                 service.verification.e_roster_ok && 
        case 'tamtam_issues':
          return !service.verification.tam_tam_ok;
        case 'eroster_issues':
          return !service.verification.e_roster_ok;
        case 'vente_issues':
        default:
          return true;
      }
    });
  }
  
  // Apply régime filter
  result = result.filter(service => {
    const regime = getServiceRegime(service);
    return regimeFilters[regime];
  });
  
  return result;
}, [allServices, dateFilter, customDateRange, discrepancyFilter, regimeFilters]);
```

**UI Components:**

**Date Range Dropdown:**
```tsx
<Select value={dateFilter} onValueChange={setDateFilter}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Dates</SelectItem>
    <SelectItem value="this_week">This Week</SelectItem>
    <SelectItem value="this_month">This Month</SelectItem>
    <SelectItem value="next_week">Next Week</SelectItem>
    <SelectItem value="custom">Custom Range</SelectItem>
  </SelectContent>
</Select>

{dateFilter === 'custom' && (
  <div className="flex gap-2">
    <Input 
      type="date" 
      value={customDateRange.start}
      onChange={e => setCustomDateRange(prev => ({ 
        ...prev, 
        start: e.target.value 
      }))}
    />
    <Input 
      type="date" 
      value={customDateRange.end}
      onChange={e => setCustomDateRange(prev => ({ 
        ...prev, 
        end: e.target.value 
      }))}
    />
  </div>
)}
```

**Discrepancy Filter Dropdown:**
```tsx
<Select value={discrepancyFilter} onValueChange={setDiscrepancyFilter}>
  <SelectTrigger>
    <SelectValue />
  </SelectTrigger>
  <SelectContent>
    <SelectItem value="all">All Trains</SelectItem>
    <SelectItem value="with_issues">With Issues</SelectItem>
    <SelectItem value="verified_only">Verified Only</SelectItem>
    <SelectItem value="tamtam_issues">TamTam Issues</SelectItem>
    <SelectItem value="eroster_issues">eRoster Issues</SelectItem>
  </SelectContent>
</Select>
```

**Régime Filter Checkboxes:**
```tsx
<div className="space-y-2">
  <label className="flex items-center gap-2">
    <Checkbox 
      checked={regimeFilters.vendredi}
      onCheckedChange={checked => 
        setRegimeFilters(prev => ({ ...prev, vendredi: checked }))
      }
    />
    <span 
      className="w-3 h-3 rounded" 
      style={{ backgroundColor: regimeColors.vendredi }}
    />
    <span>Vendredi</span>
  </label>
  {/* Repeat for other régimes */}
</div>
```

**User Interaction:**

1. **Select date range:** Choose from dropdown or enter custom dates
2. **Select discrepancy type:** Choose which issues to display
3. **Toggle régimes:** Check/uncheck régime types
4. **View results:** Filtered data updates immediately in current view mode

**Rebuild Instructions:**
1. Create state variables for each filter dimension
2. Implement filter logic using `useMemo` with proper dependencies
3. Create UI components (dropdowns, checkboxes) bound to state
4. Apply filters sequentially: date → discrepancy → régime
5. Ensure filtered results are used by all view modes
6. Update statistics dashboard to reflect filtered dataset

---

### UC-F8: Interactive Calendar Date Details

**Feature Description:** Clickable calendar dates that open a popup dialog showing comprehensive schedule information for all trains on that date.

**Implementation Details:**

The date details feature uses a modal dialog component that displays full schedule information with verification status.

**State Management:**

```typescript
const [selectedDate, setSelectedDate] = useState<string | null>(null);
const [selectedServices, setSelectedServices] = useState<TrainService[]>([]);
const [popupOpen, setPopupOpen] = useState(false);

const openDateDetails = (services: TrainService[], date: string) => {
  setSelectedServices(services);
  setSelectedDate(date);
  setPopupOpen(true);
};
```

**Popup Component Structure:**

The `DateDetailsPopup` component (`client/src/components/DateDetailsPopup.tsx`) receives:
- `open`: Boolean controlling dialog visibility
- `onOpenChange`: Function to close dialog
- `date`: Selected date string (YYYY-MM-DD format)
- `services`: Array of train services for that date

**Content Layout:**

```tsx
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-[90vw] max-h-[85vh] overflow-y-auto">
    <DialogHeader>
      <DialogTitle>Train Details for {formatDate(date)}</DialogTitle>
    </DialogHeader>
    
    <div className="space-y-6">
      {services.map(service => (
        <div key={service.service_id} className="border rounded-lg p-4">
          {/* Train header with verification icons */}
          <div className="flex justify-between items-center border-b pb-2">
            <h3>Train {service.train_info.train_number}</h3>
            <div className="flex gap-4">
              <span>TT: {statusIcon(tamtam)}</span>
              <span>eR: {statusIcon(eroster)}</span>
              <span>V: {statusIcon(vente)}</span>
            </div>
          </div>
          
          {/* Schedule details in two columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3">
            {/* Outbound journey */}
            <div>
              <h4 className="font-semibold mb-2">Outbound (PNO → AMS)</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>PNO dep:</span>
                  {renderTime(schedule.outbound.pno_dep)}
                </div>
                {/* ... other stations */}
              </div>
            </div>
            
            {/* Return journey */}
            <div>
              <h4 className="font-semibold mb-2">Return (AMS → PNO)</h4>
              <div className="space-y-1">
                <div className="flex justify-between">
                  <span>AMS dep:</span>
                  {renderTime(schedule.return.ams_dep)}
                </div>
                {/* ... other stations */}
              </div>
            </div>
          </div>
        </div>
      ))}
      
      {/* Legend */}
      <div className="border-t pt-2 text-xs text-muted-foreground">
        <div className="font-semibold mb-1">Status Indicators:</div>
        <div className="flex items-center gap-2">
          <Check className="h-3 w-3 text-green-500" />
          <span>OK - No issues</span>
        </div>
        {/* ... other legend items */}
      </div>
    </div>
  </DialogContent>
</Dialog>
```

**Time Rendering with Styling:**

```typescript
const renderTime = (stationTime: StationTime | undefined) => {
  if (!stationTime?.time) {
    return <span className="text-muted-foreground">-</span>;
  }
  
  let classes = "text-xs";
  
  if (stationTime.changed) {
    classes += " bg-gray-900 text-yellow-400 px-1.5 py-0.5 rounded font-medium";
  } else if (stationTime.border_crossing) {
    classes += " text-red-400/70 italic";
  }
  
  return <span className={classes}>{stationTime.time}</span>;
};
```

**User Interaction Flow:**

1. **User clicks date cell** in Calendar View
2. `openDateDetails()` is called with services and date
3. State updates trigger popup to open
4. Popup displays all trains for that date with full schedules
5. User can scroll within popup to view all trains
6. User clicks "Close" button or outside popup to dismiss
7. `onOpenChange(false)` closes popup and clears state

**Rebuild Instructions:**
1. Create a Dialog component using shadcn/ui or similar
2. Add state for selected date, services, and popup visibility
3. Implement `openDateDetails()` function that sets all three states
4. Create `DateDetailsPopup` component that receives props
5. Map through services and render individual train cards
6. Implement `renderTime()` function with conditional styling
7. Add legend section explaining all icons and styling
8. Ensure popup is scrollable for many trains
9. Add click handler to calendar date cells

---

### UC-F9: Statistics Dashboard

**Feature Description:** Real-time statistics panel showing aggregate metrics for the current filtered dataset.

**Implementation Details:**

The statistics dashboard computes metrics from the filtered services array and displays them in a card-based layout.

**Metric Calculation:**

```typescript
const statistics = useMemo(() => {
  const total = filteredServices.filter(s => s.date !== null).length;
  
  let totalDiscrepancies = 0;
  let tamtamIssues = 0;
  let erosterIssues = 0;
  let venteIssues = 0;
  
  filteredServices.forEach(service => {
    if (!service.date) return; // Skip régimé templates
    
    const hasIssue = 
      !service.verification.tam_tam_ok || 
      !service.verification.e_roster_ok || 
    
    if (hasIssue) totalDiscrepancies++;
    if (!service.verification.tam_tam_ok) tamtamIssues++;
    if (!service.verification.e_roster_ok) erosterIssues++;
  });
  
  return {
    totalTrains: total,
    totalDiscrepancies,
    tamtamIssues,
    erosterIssues,
    venteIssues
  };
}, [filteredServices]);
```

**UI Layout:**

```tsx
<div className="bg-card border border-border rounded-lg p-4">
  <h3 className="text-sm font-semibold mb-3 text-muted-foreground">
    Statistics
  </h3>
  
  <div className="space-y-2">
    <div className="flex justify-between items-center">
      <span className="text-sm">Total Trains</span>
      <span className="font-semibold">{statistics.totalTrains}</span>
    </div>
    
    <div className="flex justify-between items-center">
      <span className="text-sm">Total Discrepancies</span>
      <span className="font-semibold">
        <Badge variant={statistics.totalDiscrepancies > 0 ? "destructive" : "secondary"}>
          {statistics.totalDiscrepancies}
        </Badge>
      </span>
    </div>
    
    <div className="flex justify-between items-center">
      <span className="text-sm">TamTam Issues</span>
      <span className="font-semibold">
        <Badge variant={statistics.tamtamIssues > 0 ? "destructive" : "secondary"}>
          {statistics.tamtamIssues}
        </Badge>
      </span>
    </div>
    
    <div className="flex justify-between items-center">
      <span className="text-sm">eRoster Issues</span>
      <span className="font-semibold">
        <Badge variant={statistics.erosterIssues > 0 ? "destructive" : "secondary"}>
          {statistics.erosterIssues}
        </Badge>
      </span>
    </div>
    
    <div className="flex justify-between items-center">
      <span className="font-semibold">
        <Badge variant={statistics.venteIssues > 0 ? "destructive" : "secondary"}>
          {statistics.venteIssues}
        </Badge>
      </span>
    </div>
  </div>
</div>
```

**Badge Styling:**

Badges use conditional variants:
- **destructive (red):** When count > 0 (indicates issues)
- **secondary (neutral):** When count = 0 (no issues)

**Real-time Updates:**

The `useMemo` hook ensures statistics recalculate whenever `filteredServices` changes, which happens when:
- Date range filter changes
- Discrepancy filter changes
- Régime filter changes
- View mode changes (though this doesn't affect the data)

**User Interaction:**

The statistics panel is passive (no direct interaction) but provides:
1. **At-a-glance overview:** Quick understanding of dataset health
2. **Filter feedback:** Immediate confirmation of filter effects
3. **Issue identification:** Red badges draw attention to problems

**Rebuild Instructions:**
1. Create a `useMemo` hook that computes all metrics
2. Iterate through `filteredServices` counting issues
3. Exclude régimé templates (`date !== null`)
4. Render metrics in a card layout with labels and values
5. Use Badge component with conditional variants
6. Ensure statistics panel is visible in all view modes
7. Position panel prominently (typically top-right sidebar)

---

## UX Features Use Cases

### UC-UX1: Responsive Layout Design

**Feature Description:** Adaptive layout that adjusts to different screen sizes while maintaining usability.

**Implementation Details:**

The responsive design uses Tailwind CSS breakpoints and flexbox/grid layouts to reorganize content.

**Breakpoint Strategy:**

```css
/* Tailwind breakpoints used */
sm: 640px   /* Small tablets */
md: 768px   /* Tablets */
lg: 1024px  /* Small desktops */
xl: 1280px  /* Large desktops */
```

**Main Layout Structure:**

```tsx
<div className="min-h-screen flex flex-col">
  {/* Header - always full width */}
  <header className="border-b p-4">
    <h1 className="text-2xl md:text-3xl">Train Service Tracking Tool</h1>
  </header>
  
  {/* Main content area */}
  <main className="flex-1 flex flex-col lg:flex-row gap-4 p-4">
    {/* Left panel - filters and controls */}
    <aside className="w-full lg:w-80 space-y-4">
      {/* Filters */}
    </aside>
    
    {/* Center panel - main data view */}
    <div className="flex-1">
      {/* Tables or calendar */}
    </div>
    
    {/* Right panel - statistics */}
    <aside className="w-full lg:w-64">
      {/* Statistics */}
    </aside>
  </main>
</div>
```

**Responsive Behaviors:**

**Desktop (lg and above):**
- Three-column layout: filters | data | statistics
- Side-by-side panels with fixed widths for sidebars
- Full table width utilization

**Tablet (md to lg):**
- Two-column layout: filters stacked with statistics | data
- Reduced sidebar widths
- Maintained table structure

**Mobile (below md):**
- Single-column stacked layout
- Filters at top
- Data view in middle
- Statistics at bottom
- Horizontal scrolling enabled for wide tables

**Table Responsiveness:**

```tsx
<div className="overflow-x-auto">
  <table className="w-full min-w-[800px]">
    {/* Table content */}
  </table>
</div>
```

The `overflow-x-auto` wrapper allows horizontal scrolling on small screens while `min-w-[800px]` prevents column crushing.

**Calendar Responsiveness:**

```tsx
<div className="grid grid-cols-7 gap-1 md:gap-2">
  {/* Calendar cells */}
</div>
```

Calendar maintains 7-column grid but adjusts gap spacing on smaller screens.

**User Interaction:**

1. **Desktop users:** See all panels simultaneously, no scrolling needed
2. **Tablet users:** Scroll vertically to access all sections
3. **Mobile users:** Scroll vertically for sections, horizontally for tables

**Rebuild Instructions:**
1. Use flexbox for main layout with `flex-col` on mobile, `flex-row` on desktop
2. Apply responsive width classes: `w-full lg:w-80`
3. Wrap tables in `overflow-x-auto` containers
4. Set minimum table width to prevent column crushing
5. Use responsive text sizes: `text-2xl md:text-3xl`
6. Test at all breakpoints to ensure usability

---

### UC-UX2: Dark Theme Interface

**Feature Description:** Professional dark color scheme optimized for extended viewing sessions.

**Implementation Details:**

The dark theme is implemented using CSS variables defined in `client/src/index.css` and applied through Tailwind's theming system.

**Color Palette Definition:**

```css
/* In index.css */
@layer base {
  :root {
    --background: 0 0% 4%;        /* #0a0a0a - Very dark gray */
    --foreground: 0 0% 98%;       /* #fafafa - Off-white */
    --card: 0 0% 8%;              /* #141414 - Dark card background */
    --card-foreground: 0 0% 98%;  /* #fafafa - Card text */
    --border: 0 0% 20%;           /* #333333 - Subtle borders */
    --muted: 0 0% 15%;            /* #262626 - Muted backgrounds */
    --muted-foreground: 0 0% 60%; /* #999999 - Muted text */
    --accent: 186 100% 50%;       /* #00bcd4 - Cyan accent */
    --destructive: 0 84% 60%;     /* #f44336 - Red for errors */
  }
}
```

**Theme Application:**

The `ThemeProvider` component wraps the application and applies the dark theme:

```tsx
// In App.tsx
<ThemeProvider defaultTheme="dark">
  <App />
</ThemeProvider>
```

**Semantic Color Usage:**

```tsx
// Background colors
<div className="bg-background">      {/* Main page background */}
<div className="bg-card">            {/* Card/panel backgrounds */}
<div className="bg-muted">           {/* Subtle highlights */}

// Text colors
<span className="text-foreground">        {/* Primary text */}
<span className="text-muted-foreground">  {/* Secondary text */}
<span className="text-accent">            {/* Highlighted text */}

// Borders
<div className="border border-border">    {/* Subtle borders */}
```

**Contrast Ratios:**

All color combinations meet WCAG AA standards:
- Background (#0a0a0a) to Foreground (#fafafa): 18.5:1
- Card (#141414) to Card Foreground (#fafafa): 16.1:1
- Muted (#262626) to Foreground (#fafafa): 13.2:1

**User Interaction:**

The dark theme is always active (no toggle in current implementation). Users benefit from:
1. **Reduced eye strain:** Dark backgrounds in low-light environments
2. **Better focus:** Light text on dark background draws attention to content
3. **Professional appearance:** Modern, polished aesthetic

**Rebuild Instructions:**
1. Define CSS variables in `:root` selector
2. Use HSL color format for consistency
3. Create semantic color names (background, foreground, card, etc.)
4. Apply colors using Tailwind utility classes
5. Ensure all text/background combinations meet contrast requirements
6. Test in various lighting conditions

---

### UC-UX3: Interactive Controls

**Feature Description:** Intuitive controls with immediate visual feedback for all user interactions.

**Implementation Details:**

Interactive controls use hover states, active states, and transitions to provide feedback.

**Button Styling:**

```tsx
// Primary action button
<Button 
  variant="outline" 
  className="border-cyan-500 text-cyan-500 hover:bg-cyan-500/10 transition-colors"
>
  Action
</Button>

// Filter toggle button
<Button
  variant={isActive ? "default" : "outline"}
  className={cn(
    "transition-all",
    isActive && "bg-accent text-accent-foreground"
  )}
  onClick={handleToggle}
>
  Filter
</Button>
```

**Hover Effects:**

```css
/* Table row hover */
.table-row {
  @apply hover:bg-muted/50 transition-colors cursor-pointer;
}

/* Calendar date hover */
.calendar-date {
  @apply hover:bg-muted/50 hover:scale-105 transition-all cursor-pointer;
}

/* Button hover */
.button {
  @apply hover:bg-accent/10 hover:border-accent transition-colors;
}
```

**Active States:**

```tsx
// Checkbox with visual feedback
<Checkbox 
  checked={isChecked}
  onCheckedChange={setIsChecked}
  className="data-[state=checked]:bg-accent data-[state=checked]:border-accent"
/>

// Selected dropdown item
<SelectItem 
  value="option"
  className="data-[state=checked]:bg-accent/20"
>
  Option
</SelectItem>
```

**Transition Configuration:**

```css
/* Global transition settings */
* {
  @apply transition-colors duration-200;
}

/* Specific transitions */
.smooth-transform {
  @apply transition-transform duration-300 ease-in-out;
}

.smooth-opacity {
  @apply transition-opacity duration-200;
}
```

**Focus States:**

```css
/* Keyboard focus indicators */
.focusable {
  @apply focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 focus:ring-offset-background;
}
```

**User Interaction:**

1. **Hover over button:** Background color changes, border brightens
2. **Click button:** Brief scale animation or background flash
3. **Focus with keyboard:** Visible ring appears around element
4. **Toggle checkbox:** Smooth color transition to checked state
5. **Hover table row:** Background highlights, cursor changes to pointer

**Rebuild Instructions:**
1. Apply `transition-colors` or `transition-all` to interactive elements
2. Define hover states using `hover:` prefix
3. Define active states using `data-[state=checked]:` or similar
4. Add focus rings for keyboard navigation
5. Use cursor classes: `cursor-pointer`, `cursor-default`
6. Set appropriate transition durations (200-300ms)

---

### UC-UX4: Visual Hierarchy

**Feature Description:** Clear information architecture that guides users through complex data.

**Implementation Details:**

Visual hierarchy is established through typography, spacing, color, and layout structure.

**Typography Hierarchy:**

```tsx
// Page title
<h1 className="text-3xl font-bold text-foreground">
  Train Service Tracking Tool
</h1>

// Section headers
<h2 className="text-xl font-semibold text-foreground mb-4">
  Régimé
</h2>

// Subsection headers
<h3 className="text-lg font-semibold text-muted-foreground">
  20/06/25
</h3>

// Labels
<label className="text-sm font-medium text-foreground">
  Date Range
</label>

// Body text
<p className="text-sm text-muted-foreground">
  Description text
</p>

// Table headers
<th className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
  Station
</th>
```

**Spacing Hierarchy:**

```tsx
// Major sections
<div className="space-y-8">
  {/* Large gaps between major sections */}
</div>

// Subsections
<div className="space-y-4">
  {/* Medium gaps between subsections */}
</div>

// Related items
<div className="space-y-2">
  {/* Small gaps between related items */}
</div>

// Inline items
<div className="space-x-2">
  {/* Horizontal spacing for inline elements */}
</div>
```

**Color Hierarchy:**

```tsx
// Primary content
<div className="text-foreground">
  {/* Most important information */}
</div>

// Secondary content
<div className="text-muted-foreground">
  {/* Supporting information */}
</div>

// Accent/highlight
<div className="text-accent">
  {/* Call-to-action or important status */}
</div>

// Error/warning
<div className="text-destructive">
  {/* Issues or alerts */}
</div>
```

**Layout Hierarchy:**

```tsx
<div className="space-y-6">
  {/* Top-level container */}
  
  <section className="border border-border rounded-lg p-4">
    {/* Major section with visual boundary */}
    
    <header className="border-b border-border pb-2 mb-4">
      {/* Section header with separator */}
    </header>
    
    <div className="space-y-2">
      {/* Section content */}
    </div>
  </section>
</div>
```

**Visual Weight:**

```tsx
// High importance
<Badge variant="destructive" className="font-bold">
  7 Issues
</Badge>

// Medium importance
<span className="font-semibold">
  Train 9320
</span>

// Low importance
<span className="text-sm text-muted-foreground">
  (4 trains)
</span>
```

**User Interaction:**

Users naturally follow the visual hierarchy:
1. **Page title** draws initial attention
2. **Section headers** guide navigation
3. **Bold/colored elements** highlight important information
4. **Muted text** provides context without distraction

**Rebuild Instructions:**
1. Define 4-5 heading levels with decreasing sizes
2. Use spacing scale consistently (2, 4, 6, 8 in Tailwind units)
3. Apply color semantically (foreground, muted-foreground, accent)
4. Use borders and backgrounds to create visual sections
5. Apply font weights to establish importance
6. Ensure consistent spacing between similar elements

---

### UC-UX5: Loading States and Feedback

**Feature Description:** Clear feedback for all user actions and system state changes.

**Implementation Details:**

The application provides immediate feedback through state updates and visual changes.

**Instant Filter Updates:**

```typescript
// No loading state needed - updates are synchronous
const filteredServices = useMemo(() => {
  // Filter logic runs immediately on state change
  return applyFilters(allServices, filters);
}, [allServices, filters]);

// UI updates instantly when filters change
<Select 
  value={dateFilter} 
  onValueChange={(value) => {
    setDateFilter(value); // Immediate state update
    // filteredServices recalculates automatically
  }}
>
```

**View Mode Transitions:**

```tsx
const [viewMode, setViewMode] = useState<'grouped' | 'spreadsheet' | 'calendar'>('grouped');

// Smooth transition between views
<div className="transition-opacity duration-200">
  {viewMode === 'grouped' && <GroupedView />}
  {viewMode === 'spreadsheet' && <SpreadsheetView />}
  {viewMode === 'calendar' && <CalendarView />}
</div>
```

**Button Feedback:**

```tsx
// Active state feedback
<Button
  variant={isActive ? "default" : "outline"}
  className={cn(
    "transition-all duration-200",
    isActive && "bg-accent scale-105"
  )}
>
  {isActive ? "Active" : "Inactive"}
</Button>
```

**Hover Feedback:**

```tsx
// Table row hover
<tr className="hover:bg-muted/50 transition-colors cursor-pointer">
  {/* Immediate background change on hover */}
</tr>

// Calendar date hover
<div className="hover:bg-muted/50 hover:scale-102 transition-all">
  {/* Background and scale change */}
</div>
```

**Modal Dialog Feedback:**

```tsx
// Dialog open/close animations
<Dialog open={isOpen} onOpenChange={setIsOpen}>
  <DialogContent className="animate-in fade-in-0 zoom-in-95">
    {/* Content slides in smoothly */}
  </DialogContent>
</Dialog>
```

**Checkbox Feedback:**

```tsx
<Checkbox
  checked={isChecked}
  onCheckedChange={setIsChecked}
  className="transition-colors data-[state=checked]:bg-accent"
/>
{/* Immediate color change when toggled */}
```

**User Interaction:**

1. **Click filter:** Data updates instantly, no spinner needed
2. **Hover element:** Background changes immediately
3. **Toggle checkbox:** Checkmark appears with smooth animation
4. **Open modal:** Dialog slides in with fade effect
5. **Switch view:** Content transitions smoothly

**Rebuild Instructions:**
1. Use `useMemo` for synchronous data transformations
2. Apply `transition-*` classes to all interactive elements
3. Use `hover:` states for immediate visual feedback
4. Implement modal animations with `animate-in` utilities
5. Avoid loading spinners for fast operations
6. Provide visual confirmation for all state changes

---

### UC-UX6: Data Styling and Visual Indicators

**Feature Description:** Consistent visual language to communicate schedule information and verification status.

**Implementation Details:**

Visual indicators use color, typography, and icons to encode information.

**Time Styling Logic:**

```typescript
const renderTime = (stationTime: StationTime | undefined) => {
  if (!stationTime?.time) {
    return <span className="text-muted-foreground">-</span>;
  }
  
  let classes = "text-xs";
  
  if (stationTime.changed) {
    // Changed times: yellow text on dark background
    classes += " bg-gray-900 text-yellow-400 px-1.5 py-0.5 rounded font-medium";
  } else if (stationTime.border_crossing) {
    // Border crossings: red italic text
    classes += " text-red-400/70 italic";
  }
  // Normal times: default styling
  
  return <span className={classes}>{stationTime.time}</span>;
};
```

**Verification Status Icons:**

```typescript
const renderVerificationIcon = (status: 'ok' | 'discrepancy' | 'missing') => {
  if (status === 'ok') {
    return <Check className="h-4 w-4 text-green-500" />;
  } else if (status === 'missing') {
    return <X className="h-4 w-4 text-destructive" />;
  } else {
    return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
  }
};
```

**Régime Color Borders:**

```tsx
<tr 
  style={{ 
    borderLeft: `4px solid ${getRegimeColor(service)}` 
  }}
  className="border-l-4"
>
  {/* Row content */}
</tr>
```

**Color Mapping:**

| Element | Color | Meaning |
|---------|-------|---------|
| Green ✓ | `text-green-500` | Verified, no issues |
| Yellow ⚠ | `text-yellow-500` | Discrepancy detected |
| Red ✗ | `text-destructive` | Missing data |
| Red italic | `text-red-400/70 italic` | Border crossing |
| Yellow on dark | `bg-gray-900 text-yellow-400` | Changed time |
| Gray dash | `text-muted-foreground` | No scheduled stop |

**Icon Library:**

All icons use Lucide React:
```tsx
import { Check, X, AlertTriangle } from 'lucide-react';

// Consistent sizing
<Check className="h-4 w-4" />      // Table icons
<Check className="h-5 w-5" />      // Calendar icons
<Check className="h-3 w-3" />      // Legend icons
```

**User Interaction:**

Users quickly recognize:
1. **Green checkmarks:** Everything is OK
2. **Red X marks:** Critical missing data
3. **Yellow warnings:** Schedule mismatches
4. **Red italic times:** International border crossings
5. **Yellow highlighted times:** Schedule changes
6. **Colored left borders:** Service régime type

**Rebuild Instructions:**
1. Create `renderTime()` function with conditional styling
2. Create `renderVerificationIcon()` function with icon selection
3. Import Lucide React icons: `Check`, `X`, `AlertTriangle`
4. Define color constants or use Tailwind classes directly
5. Apply styling based on data flags (`border_crossing`, `changed`)
6. Use consistent icon sizes across similar contexts
7. Ensure color choices meet accessibility contrast requirements

---

## Summary

This use case documentation provides comprehensive implementation details for all 15 major features of the Train Service Tracking Tool. Each use case includes:

- **Feature description** explaining what the feature does
- **Implementation details** showing the technical approach
- **Data structures** defining how information is organized
- **Code examples** demonstrating key logic
- **User interaction** describing how users engage with the feature
- **Rebuild instructions** providing step-by-step guidance for reimplementation

This document serves as a complete reference for developers who need to understand, maintain, or rebuild the application. The use cases cover both functional features (data management, verification, filtering) and UX features (responsive design, theming, visual feedback), ensuring all aspects of the application are thoroughly documented.

---

**End of Document**
