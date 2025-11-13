# Train Service Tracking Tool - Business Logic & Rules

**Document Version:** 1.0  
**Last Updated:** November 11, 2025  
**Author:** Manus AI

---

## Purpose

This document provides a comprehensive specification of all business logic, rules, algorithms, and calculations used in the Train Service Tracking Tool. Development teams can implement these rules in any programming language while maintaining consistency with the application's requirements.

---

## Core Business Rules

### Rule 1: Totem+ as Source of Truth

**Rule Statement:** Totem+ schedule data is always considered the authoritative reference for all verification comparisons.

**Implementation:**
- All schedule comparisons use Totem+ as the baseline
- Tam Tam and eRoster are compared against Totem+, never against each other
- If Totem+ has no data for a service, verification cannot be performed

**Rationale:** Totem+ is the official scheduling system and represents the intended operational schedule.

---

### Rule 2: Three-System Verification


**Implementation:**
- Each flag is computed independently
- A service is considered "fully verified" only when all three flags are true

**Verification States:**

|------------|-------------|------------------|----------------|
| true | true | true | Fully Verified ✓ |
| false | true | true | Tam Tam Issue ⚠ |
| true | false | true | eRoster Issue ⚠ |
| false | false | true | Multiple Issues ⚠⚠ |
| false | false | false | Critical Issues ⚠⚠⚠ |

---

### Rule 3: Partial Journey Support

**Rule Statement:** Train services may operate outbound only, return only, or both directions.

**Implementation:**
- A journey is considered "empty" when all station times are null/undefined
- Verification only compares stations that exist in Totem+ schedule
- Missing stations in Totem+ are not considered discrepancies in other systems

**Examples:**

**Return-Only Service:**
```
Outbound: all stations null
Return: BRU dep, WNH arr, PNO arr have times
→ Only compare return journey stations
```

**Outbound-Only Service:**
```
Outbound: PNO dep, WNH arr, BRU arr have times
Return: all stations null
→ Only compare outbound journey stations
```

---

### Rule 4: Régime Classification

**Rule Statement:** Services are classified into operational régimes based on their weekly schedule pattern.

**Régime Definitions:**

| Régime | Days of Operation | Description |
|--------|------------------|-------------|
| **Vendredi** | Friday only | Services operating exclusively on Fridays |
| **Samedi** | Saturday only | Services operating exclusively on Saturdays |
| **Dimanche** | Sunday only | Services operating exclusively on Sundays |
| **Lundi-Jeudi** | Monday through Thursday | Weekday services excluding Friday |
| **Tous les jours** | Every day | Daily services (7 days/week) |
| **Lundi-Vendredi** | Monday through Friday | Weekday services including Friday |
| **Samedi-Dimanche** | Saturday and Sunday | Weekend services |

**Classification Algorithm:**
```
function classifyRegime(service):
    if service.date is null:
        return service.regime  // Template service, use predefined régime
    
    dayOfWeek = getDayOfWeek(service.date)
    
    // Analyze operational pattern
    if operatesOnlyOnFridays(service):
        return VENDREDI
    else if operatesOnlyOnSaturdays(service):
        return SAMEDI
    else if operatesOnlyOnSundays(service):
        return DIMANCHE
    else if operatesMonThroughThu(service):
        return LUNDI_JEUDI
    else if operatesEveryDay(service):
        return TOUS_LES_JOURS
    else if operatesMonThroughFri(service):
        return LUNDI_VENDREDI
    else if operatesWeekends(service):
        return SAMEDI_DIMANCHE
```

---

## Verification Algorithms

### Algorithm 1: Tam Tam Verification

**Purpose:** Determine if Tam Tam schedule matches Totem+ schedule.

**Inputs:**
- `totemSchedule`: JourneySchedule from Totem+ system
- `tamTamSchedule`: JourneySchedule from Tam Tam system

**Output:**
- `tam_tam_ok`: Boolean (true = verified, false = discrepancy or missing)

**Algorithm:**

```
function verifyTamTam(totemSchedule, tamTamSchedule):
    // Step 1: Check for missing data
    if isMissingData(tamTamSchedule):
        return false  // Missing data
    
    // Step 2: Compare outbound journey
    if not isJourneyEmpty(totemSchedule.outbound):
        if hasDiscrepancy(totemSchedule.outbound, tamTamSchedule.outbound):
            return false  // Outbound discrepancy
    
    // Step 3: Compare return journey
    if not isJourneyEmpty(totemSchedule.return):
        if hasDiscrepancy(totemSchedule.return, tamTamSchedule.return):
            return false  // Return discrepancy
    
    // Step 4: All checks passed
    return true  // Verified

function isMissingData(schedule):
    // Check if schedule has any time values
    allStations = getAllStations(schedule.outbound, schedule.return)
    
    for each station in allStations:
        if station.time is not null:
            return false  // Has at least one time
    
    return true  // No times found, missing data

function isJourneyEmpty(journey):
    allStations = getAllStations(journey)
    
    for each station in allStations:
        if station.time is not null:
            return false  // Has at least one time
    
    return true  // No times, journey is empty

function hasDiscrepancy(totemJourney, targetJourney):
    stations = getStationList(totemJourney)
    
    for each station in stations:
        totemTime = totemJourney[station].time
        targetTime = targetJourney[station].time
        
        if totemTime is not null:
            if targetTime is null or totemTime != targetTime:
                return true  // Discrepancy found
    
    return false  // No discrepancies
```

**Edge Cases:**

1. **Totem+ has time, Tam Tam missing:**
   - Result: Discrepancy (false)
   - Example: Totem+ shows "12:22", Tam Tam shows null

2. **Totem+ missing, Tam Tam has time:**
   - Result: No discrepancy (ignored)
   - Example: Totem+ shows null, Tam Tam shows "12:22"

3. **Both missing:**
   - Result: No discrepancy (both empty)
   - Example: Both show null

4. **Times differ:**
   - Result: Discrepancy (false)
   - Example: Totem+ shows "12:22", Tam Tam shows "12:23"

---

### Algorithm 2: eRoster Verification

**Purpose:** Determine if eRoster schedule matches Totem+ schedule.

**Implementation:** Identical to Tam Tam verification algorithm, but comparing Totem+ with eRoster.

```
function verifyERoster(totemSchedule, eRosterSchedule):
    // Same logic as verifyTamTam
    return verifySystem(totemSchedule, eRosterSchedule)
```

---


**Purpose:** Determine if service is available for ticket sales.

**Inputs:**
- `service`: TrainService object

**Output:**

**Algorithm:**

```
function verifyMiseEnVente(service):
    // This is typically set externally by the ticket sales system
    // No comparison logic needed, just return the flag
```


---

## Filtering Algorithms

### Filter 1: Date Range Filter

**Purpose:** Filter services to show only those within a specified date range.

**Filter Options:**

| Option | Logic |
|--------|-------|
| **All Dates** | No filtering, show all services |
| **This Week** | Show services where date is in current week (Sunday to Saturday) |
| **This Month** | Show services where date is in current month |
| **Next Week** | Show services where date is in next week |
| **Custom Range** | Show services where date is between user-specified start and end dates |

**Algorithm:**

```
function filterByDateRange(services, dateFilter, customRange):
    if dateFilter == "all":
        return services
    
    today = getCurrentDate()
    
    if dateFilter == "this_week":
        weekStart = getStartOfWeek(today)
        weekEnd = getEndOfWeek(today)
        return services.filter(s => s.date >= weekStart and s.date <= weekEnd)
    
    else if dateFilter == "this_month":
        monthStart = getStartOfMonth(today)
        monthEnd = getEndOfMonth(today)
        return services.filter(s => s.date >= monthStart and s.date <= monthEnd)
    
    else if dateFilter == "next_week":
        nextWeekStart = getStartOfWeek(today + 7 days)
        nextWeekEnd = getEndOfWeek(today + 7 days)
        return services.filter(s => s.date >= nextWeekStart and s.date <= nextWeekEnd)
    
    else if dateFilter == "custom":
        return services.filter(s => s.date >= customRange.start and s.date <= customRange.end)
```

**Special Cases:**
- Services with `date = null` (régimé templates) are always excluded from date filtering
- Week starts on Sunday (configurable based on locale)

---

### Filter 2: Discrepancy Filter

**Purpose:** Filter services based on verification status.

**Filter Options:**

| Option | Logic |
|--------|-------|
| **All Trains** | No filtering, show all services |
| **With Issues** | Show only services where at least one verification flag is false |
| **Verified Only** | Show only services where all verification flags are true |
| **TamTam Issues** | Show only services where `tam_tam_ok = false` |
| **eRoster Issues** | Show only services where `e_roster_ok = false` |

**Algorithm:**

```
function filterByDiscrepancy(services, discrepancyFilter):
    if discrepancyFilter == "all":
        return services
    
    if discrepancyFilter == "with_issues":
        return services.filter(s => 
            not s.verification.tam_tam_ok or 
            not s.verification.e_roster_ok or 
        )
    
    else if discrepancyFilter == "verified_only":
        return services.filter(s => 
            s.verification.tam_tam_ok and 
            s.verification.e_roster_ok and 
        )
    
    else if discrepancyFilter == "tamtam_issues":
        return services.filter(s => not s.verification.tam_tam_ok)
    
    else if discrepancyFilter == "eroster_issues":
        return services.filter(s => not s.verification.e_roster_ok)
    
    else if discrepancyFilter == "vente_issues":
```

---

### Filter 3: Régime Filter

**Purpose:** Filter services to show only selected régime types.

**Inputs:**
- `services`: Array of TrainService objects
- `regimeFilters`: Object with boolean flags for each régime type

**Algorithm:**

```
function filterByRegime(services, regimeFilters):
    return services.filter(s => {
        regime = getServiceRegime(s)
        
        switch (regime):
            case VENDREDI:
                return regimeFilters.vendredi
            case SAMEDI:
                return regimeFilters.samedi
            case DIMANCHE:
                return regimeFilters.dimanche
            case LUNDI_JEUDI:
                return regimeFilters.lundi_jeudi
            case TOUS_LES_JOURS:
                return regimeFilters.tous_les_jours
            case LUNDI_VENDREDI:
                return regimeFilters.lundi_vendredi
            case SAMEDI_DIMANCHE:
                return regimeFilters.samedi_dimanche
            default:
                return true  // Unknown régime, include by default
    })
```

---

### Combined Filter Application

**Purpose:** Apply all filters in sequence to produce final filtered dataset.

**Algorithm:**

```
function applyAllFilters(allServices, filters):
    result = allServices
    
    // Step 1: Apply date range filter
    result = filterByDateRange(result, filters.dateRange, filters.customRange)
    
    // Step 2: Apply discrepancy filter
    result = filterByDiscrepancy(result, filters.discrepancy)
    
    // Step 3: Apply régime filter
    result = filterByRegime(result, filters.regimeFilters)
    
    return result
```

**Filter Order Rationale:**
1. Date range first (typically reduces dataset the most)
2. Discrepancy second (further reduces based on status)
3. Régime last (final refinement)

---

## Statistics Calculation

### Statistic 1: Total Trains

**Purpose:** Count total number of services in filtered dataset.

**Algorithm:**

```
function calculateTotalTrains(filteredServices):
    // Exclude régimé templates (date = null)
    actualServices = filteredServices.filter(s => s.date is not null)
    return actualServices.length
```

---

### Statistic 2: Total Discrepancies

**Purpose:** Count services with at least one verification issue.

**Algorithm:**

```
function calculateTotalDiscrepancies(filteredServices):
    count = 0
    
    for each service in filteredServices:
        if service.date is null:
            continue  // Skip régimé templates
        
        hasIssue = (
            not service.verification.tam_tam_ok or
            not service.verification.e_roster_ok or
        )
        
        if hasIssue:
            count++
    
    return count
```

---

### Statistic 3: System-Specific Issues

**Purpose:** Count services with issues in a specific system.

**Algorithms:**

```
function calculateTamTamIssues(filteredServices):
    count = 0
    
    for each service in filteredServices:
        if service.date is null:
            continue  // Skip régimé templates
        
        if not service.verification.tam_tam_ok:
            count++
    
    return count

function calculateERosterIssues(filteredServices):
    count = 0
    
    for each service in filteredServices:
        if service.date is null:
            continue
        
        if not service.verification.e_roster_ok:
            count++
    
    return count

function calculateVenteIssues(filteredServices):
    count = 0
    
    for each service in filteredServices:
        if service.date is null:
            continue
        
            count++
    
    return count
```

---

## Calendar View Logic

### Calendar Status Aggregation

**Purpose:** Determine overall status for a calendar date cell based on all services operating that day.

**Inputs:**
- `servicesForDate`: Array of TrainService objects for a specific date

**Output:**
- `dateStatus`: Object with aggregated status information

**Algorithm:**

```
function getDateStatus(servicesForDate):
    if servicesForDate.length == 0:
        return { hasServices: false }
    
    allOk = true
    hasTamTamIssue = false
    hasERosterIssue = false
    hasVenteIssue = false
    
    for each service in servicesForDate:
        if not service.verification.tam_tam_ok:
            allOk = false
            hasTamTamIssue = true
        
        if not service.verification.e_roster_ok:
            allOk = false
            hasERosterIssue = true
        
            allOk = false
            hasVenteIssue = true
    
    return {
        hasServices: true,
        allOk: allOk,
        hasTamTamIssue: hasTamTamIssue,
        hasERosterIssue: hasERosterIssue,
        hasVenteIssue: hasVenteIssue
    }
```

**Display Logic:**

```
function renderDateCell(dateStatus):
    if not dateStatus.hasServices:
        return "Empty cell (no services)"
    
    if dateStatus.allOk:
        return "Green checkmark ✓"
    
    else:
        // Show system-specific indicators
        result = []
        
        if dateStatus.hasTamTamIssue:
            result.add("TT: ⚠ or ✗")
        else:
            result.add("TT: ✓")
        
        if dateStatus.hasERosterIssue:
            result.add("eR: ⚠ or ✗")
        else:
            result.add("eR: ✓")
        
        if dateStatus.hasVenteIssue:
            result.add("V: ⚠ or ✗")
        else:
            result.add("V: ✓")
        
        return result
```

---

## Grouping and Sorting Logic

### Date Grouping (Grouped View)

**Purpose:** Organize services by operational date.

**Algorithm:**

```
function groupServicesByDate(services):
    groups = new Map()
    
    for each service in services:
        if service.date is null:
            continue  // Skip régimé templates
        
        dateKey = service.date
        
        if not groups.has(dateKey):
            groups.set(dateKey, [])
        
        groups.get(dateKey).add(service)
    
    // Sort dates chronologically
    sortedDates = sort(groups.keys())
    
    return sortedDates.map(date => {
        date: date,
        services: groups.get(date)
    })
```

---

### Service Sorting

**Purpose:** Sort services within a date group or in spreadsheet view.

**Default Sort Order:**
1. Train number (ascending)
2. Service ID (ascending) as tiebreaker

**Algorithm:**

```
function sortServices(services):
    return services.sort((a, b) => {
        // Primary sort: train number
        if a.train_info.train_number < b.train_info.train_number:
            return -1
        else if a.train_info.train_number > b.train_info.train_number:
            return 1
        
        // Secondary sort: service ID
        else:
            if a.service_id < b.service_id:
                return -1
            else if a.service_id > b.service_id:
                return 1
            else:
                return 0
    })
```

---

## Validation Rules

### Data Validation

**Service Validation:**

```
function validateService(service):
    errors = []
    
    // Required fields
    if not service.service_id:
        errors.add("service_id is required")
    
    if not service.train_info.train_number:
        errors.add("train_number is required")
    
    // Date validation
    if service.date is not null:
        if not isValidDate(service.date):
            errors.add("date must be valid ISO 8601 format (YYYY-MM-DD)")
    
    // Time validation
    allTimes = getAllTimes(service.systems_data)
    
    for each time in allTimes:
        if time is not null:
            if not matchesPattern(time, "^([01][0-9]|2[0-3]):[0-5][0-9]$"):
                errors.add("time must be in HH:MM format: " + time)
    
    // System data validation
    if not service.systems_data.totem_plus:
        errors.add("totem_plus system data is required")
    
    if not service.systems_data.tam_tam:
        errors.add("tam_tam system data is required")
    
    if not service.systems_data.e_roster:
        errors.add("e_roster system data is required")
    
    return errors
```

---

## Business Constraints

### Constraint 1: Unique Service Identification

**Constraint:** Each service must have a unique `service_id` across the entire dataset.

**Enforcement:** Database unique constraint or application-level validation before insert.

---

### Constraint 2: Train Number Uniqueness per Date

**Constraint:** A train number should not appear multiple times on the same date (excluding régimé templates).

**Enforcement:** Application warning (not a hard error, as legitimate duplicates may exist).

---

### Constraint 3: Régimé Template Exclusion

**Constraint:** Services with `date = null` are régimé templates and must be excluded from:
- Date range filtering
- Statistics calculations
- Calendar view display
- Spreadsheet view (optional, currently excluded)

**Enforcement:** All filtering and calculation functions check `date !== null`.

---

## Summary

This business logic specification provides complete, technology-agnostic algorithms for:

- **Verification**: Comparing schedules across systems to detect discrepancies and missing data
- **Filtering**: Applying date range, discrepancy, and régime filters to focus on relevant data
- **Statistics**: Calculating aggregate metrics for dashboard display
- **Calendar**: Aggregating status across services for visual calendar representation
- **Grouping**: Organizing services by date for grouped view display
- **Validation**: Ensuring data integrity and correctness

Development teams can implement these algorithms in any programming language while maintaining consistency with the application's business requirements. The algorithms are designed to be deterministic, producing the same results given the same inputs regardless of implementation technology.

---

**End of Document**
