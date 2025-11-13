import { TrainService, StationTime, Period } from "@/data/trainData";

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

type Regime = {
  monday?: TrainService[];
  tuesday?: TrainService[];
  wednesday?: TrainService[];
  thursday?: TrainService[];
  friday?: TrainService[];
  saturday?: TrainService[];
  sunday?: TrainService[];
};

interface ParsedRow {
  date: string;
  trainId: string;
  times: string[];
  dayOfWeek: DayOfWeek;
}

/**
 * Parse CSV data into structured rows
 * Supports day-first format (Day, Train, Times...) and date-first format (Date, Train, Times...)
 */
export function parseCSV(csvInput: string): ParsedRow[] {
  const lines = csvInput.trim().split('\n').filter(line => line.trim());
  
  if (lines.length === 0) {
    throw new Error("Please paste CSV data");
  }
  
  // French to English day mapping
  const dayMap: Record<string, DayOfWeek> = {
    'lundi': 'monday',
    'mardi': 'tuesday',
    'mercredi': 'wednesday',
    'jeudi': 'thursday',
    'vendredi': 'friday',
    'samedi': 'saturday',
    'dimanche': 'sunday',
    'monday': 'monday',
    'tuesday': 'tuesday',
    'wednesday': 'wednesday',
    'thursday': 'thursday',
    'friday': 'friday',
    'saturday': 'saturday',
    'sunday': 'sunday',
  };
  
  // Find first valid day line (first column contains a day of week or a date)
  let startIndex = 0;
  for (let i = 0; i < lines.length; i++) {
    const separator = lines[i].includes('\t') ? '\t' : lines[i].includes(';') ? ';' : ',';
    const columns = lines[i].split(separator).map(col => col.trim());
    const firstCol = columns[0]?.toLowerCase();
    
    // Check if first column is a day name or a date
    if (dayMap[firstCol] || firstCol?.match(/^\d{4}-\d{2}-\d{2}$/)) {
      startIndex = i;
      break;
    }
  }
  
  if (startIndex >= lines.length) {
    throw new Error("No valid data rows found. First column must contain a day of week or date.");
  }
  
  const dataLines = lines.slice(startIndex);
  const parsed: ParsedRow[] = [];
  let currentDay: DayOfWeek | null = null;
  let currentDate: string | null = null;
  
  for (const line of dataLines) {
    const separator = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
    const columns = line.split(separator).map(col => col.trim());
    
    if (columns.length < 13) {
      // Skip lines with too few columns
      continue;
    }
    
    const firstCol = columns[0]?.toLowerCase();
    let dateStr: string;
    let trainId: string;
    let times: string[];
    let dayOfWeek: DayOfWeek;
    
    // Check if first column is a day name
    if (dayMap[firstCol]) {
      // Day-first format: Day, Train, Times...
      currentDay = dayMap[firstCol];
      currentDate = null;
      trainId = columns[1];
      times = columns.slice(2, 14);
      dayOfWeek = currentDay;
      
      // Use reference date for régime rows
      const referenceDates: Record<DayOfWeek, string> = {
        'monday': '2025-01-06',
        'tuesday': '2025-01-07',
        'wednesday': '2025-01-08',
        'thursday': '2025-01-09',
        'friday': '2025-01-10',
        'saturday': '2025-01-11',
        'sunday': '2025-01-12',
      };
      dateStr = referenceDates[currentDay];
      
    } else if (firstCol?.match(/^\d{4}-\d{2}-\d{2}$/)) {
      // Date-first format: Date, Train, Times...
      currentDate = columns[0];
      trainId = columns[1];
      times = columns.slice(2, 14);
      dateStr = currentDate;
      
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        throw new Error(`Invalid date format: ${dateStr}. Use YYYY-MM-DD`);
      }
      const dayNames: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
      dayOfWeek = dayNames[date.getDay()];
      
    } else if (firstCol === '' || !firstCol) {
      // Grouped format: inherit current day or date
      if (currentDate) {
        dateStr = currentDate;
        trainId = columns[1];
        times = columns.slice(2, 14);
        const date = new Date(dateStr);
        const dayNames: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        dayOfWeek = dayNames[date.getDay()];
      } else if (currentDay) {
        trainId = columns[1];
        times = columns.slice(2, 14);
        dayOfWeek = currentDay;
        const referenceDates: Record<DayOfWeek, string> = {
          'monday': '2025-01-06',
          'tuesday': '2025-01-07',
          'wednesday': '2025-01-08',
          'thursday': '2025-01-09',
          'friday': '2025-01-10',
          'saturday': '2025-01-11',
          'sunday': '2025-01-12',
        };
        dateStr = referenceDates[currentDay];
      } else {
        throw new Error('First row must contain a day of week or date');
      }
    } else {
      // Unknown format - skip
      continue;
    }
    
    // Validate train ID
    if (!trainId || trainId.trim() === '') {
      continue;
    }
    
    parsed.push({
      date: dateStr,
      trainId,
      times,
      dayOfWeek,
    });
  }
  
  if (parsed.length === 0) {
    throw new Error("No valid train data found in CSV");
  }
  
  return parsed;
}

/**
 * Extract régime schedules from parsed rows
 * Groups trains by day of week and creates template schedules
 */
export function extractRegimeSchedules(parsedRows: ParsedRow[]): Regime {
  const regimeByDay: Record<string, Map<string, ParsedRow>> = {};
  
  // Reference dates used for régime rows
  const referenceDates = ['2025-01-06', '2025-01-07', '2025-01-08', '2025-01-09', '2025-01-10', '2025-01-11', '2025-01-12'];
  
  // Group by day and train number (only régime rows with reference dates)
  for (const row of parsedRows) {
    if (!referenceDates.includes(row.date)) continue;
    if (!regimeByDay[row.dayOfWeek]) {
      regimeByDay[row.dayOfWeek] = new Map();
    }
    
    // Keep first occurrence of each train for this day
    if (!regimeByDay[row.dayOfWeek].has(row.trainId)) {
      regimeByDay[row.dayOfWeek].set(row.trainId, row);
    }
  }
  
  // Convert to Regime structure
  const regime: Regime = {};
  
  for (const [day, trainMap] of Object.entries(regimeByDay)) {
    const trains: TrainService[] = [];
    
    for (const [trainId, row] of Array.from(trainMap.entries())) {
      const parseTime = (t: string): StationTime | undefined => {
        if (t === "-" || t === "" || !t) return undefined;
        return { time: t };
      };
      
      const service: TrainService = {
        service_id: `regime-${day}-${trainId}`,
        date: '', // Régime templates don't have specific dates
        period_id: '', // Will be set when adding to period
        train_info: {
          train_number: trainId,
          description: `${day.charAt(0).toUpperCase() + day.slice(1)} régime train ${trainId}`,
          crew: {
            driver: 'Blue',
            train_manager: 'Red',
          },
        },
        systems_data: {
          totem_plus: {
            status: 'Automatically_Created',
            visible: true,
            schedule: {
              outbound: {
                pno_dep: parseTime(row.times[0]),
                wnh_arr: parseTime(row.times[1]),
                bru_arr: parseTime(row.times[2]),
                bru_dep: parseTime(row.times[3]),
                hdk_arr: parseTime(row.times[4]),
                ams_arr: parseTime(row.times[5]),
              },
              return: {
                ams_dep: parseTime(row.times[6]),
                hdk_arr: parseTime(row.times[7]),
                bru_arr: parseTime(row.times[8]),
                bru_dep: parseTime(row.times[9]),
                wnh_arr: parseTime(row.times[10]),
                pno_arr: parseTime(row.times[11]),
              },
            },
          },
          tam_tam: {
            status: 'Automatically_Created',
            visible: true,
            schedule: {
              outbound: {
                pno_dep: parseTime(row.times[0]),
                wnh_arr: parseTime(row.times[1]),
                bru_arr: parseTime(row.times[2]),
                bru_dep: parseTime(row.times[3]),
                hdk_arr: parseTime(row.times[4]),
                ams_arr: parseTime(row.times[5]),
              },
              return: {
                ams_dep: parseTime(row.times[6]),
                hdk_arr: parseTime(row.times[7]),
                bru_arr: parseTime(row.times[8]),
                bru_dep: parseTime(row.times[9]),
                wnh_arr: parseTime(row.times[10]),
                pno_arr: parseTime(row.times[11]),
              },
            },
          },
          e_roster: {
            status: 'Automatically_Created',
            visible: true,
            schedule: {
              outbound: {
                pno_dep: parseTime(row.times[0]),
                wnh_arr: parseTime(row.times[1]),
                bru_arr: parseTime(row.times[2]),
                bru_dep: parseTime(row.times[3]),
                hdk_arr: parseTime(row.times[4]),
                ams_arr: parseTime(row.times[5]),
              },
              return: {
                ams_dep: parseTime(row.times[6]),
                hdk_arr: parseTime(row.times[7]),
                bru_arr: parseTime(row.times[8]),
                bru_dep: parseTime(row.times[9]),
                wnh_arr: parseTime(row.times[10]),
                pno_arr: parseTime(row.times[11]),
              },
            },
          },
        },
        verification: {
          tam_tam_ok: true,
          e_roster_ok: true,
        },
      };
      
      trains.push(service);
    }
    
    regime[day as DayOfWeek] = trains;
  }
  
  return regime;
}

/**
 * Roll out régime schedules to all dates in period
 */
export function rolloutRegimeToActualServices(
  regime: Regime,
  startDate: string,
  endDate: string,
  periodId: string
): TrainService[] {
  const actualServices: TrainService[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);
  
  const dayNames: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  
  // Iterate through each date in the period
  for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
    const dayOfWeek = dayNames[date.getDay()];
    const regimeForDay = regime[dayOfWeek];
    
    if (!regimeForDay || regimeForDay.length === 0) {
      continue; // No régime for this day
    }
    
    const dateStr = date.toISOString().split('T')[0];
    
    // Create actual service for each train in the régime
    for (const regimeService of regimeForDay) {
      const actualService: TrainService = {
        ...regimeService,
        service_id: `actual-${regimeService.train_info.train_number}-${dateStr}`,
        date: dateStr,
        period_id: periodId,
        train_info: {
          ...regimeService.train_info,
          description: `Train ${regimeService.train_info.train_number}`,
        },
      };
      
      actualServices.push(actualService);
    }
  }
  
  return actualServices;
}

/**
 * Import scheduled trains from parsed rows, overriding rolled-out schedules
 */
export function importScheduledTrains(
  parsedRows: ParsedRow[],
  periodId: string,
  existingServices: TrainService[]
): { services: TrainService[], overwritten: string[] } {
  const imported: TrainService[] = [];
  const overwritten: string[] = [];
  
  // Reference dates used for régime rows (skip these)
  const referenceDates = ['2025-01-06', '2025-01-07', '2025-01-08', '2025-01-09', '2025-01-10', '2025-01-11', '2025-01-12'];
  
  for (const row of parsedRows) {
    if (referenceDates.includes(row.date)) continue;
    const parseTime = (t: string): StationTime | undefined => {
      if (t === "-" || t === "" || !t) return undefined;
      return { time: t };
    };
    
    // Check if this train already exists for this date
    const existing = existingServices.find(
      s => s.date === row.date && s.train_info.train_number === row.trainId
    );
    
    if (existing) {
      overwritten.push(`Train ${row.trainId} on ${row.date}`);
    }
    
    const service: TrainService = {
      service_id: `actual-${row.trainId}-${row.date}`,
      date: row.date,
      period_id: periodId,
      train_info: {
        train_number: row.trainId,
        description: `Train ${row.trainId}`,
        crew: {
          driver: 'Blue',
          train_manager: 'Red',
        },
      },
      systems_data: {
        totem_plus: {
          status: 'Automatically_Created',
          visible: true,
          schedule: {
            outbound: {
              pno_dep: parseTime(row.times[0]),
              wnh_arr: parseTime(row.times[1]),
              bru_arr: parseTime(row.times[2]),
              bru_dep: parseTime(row.times[3]),
              hdk_arr: parseTime(row.times[4]),
              ams_arr: parseTime(row.times[5]),
            },
            return: {
              ams_dep: parseTime(row.times[6]),
              hdk_arr: parseTime(row.times[7]),
              bru_arr: parseTime(row.times[8]),
              bru_dep: parseTime(row.times[9]),
              wnh_arr: parseTime(row.times[10]),
              pno_arr: parseTime(row.times[11]),
            },
          },
        },
        tam_tam: {
          status: 'Automatically_Created',
          visible: true,
          schedule: {
            outbound: {
              pno_dep: parseTime(row.times[0]),
              wnh_arr: parseTime(row.times[1]),
              bru_arr: parseTime(row.times[2]),
              bru_dep: parseTime(row.times[3]),
              hdk_arr: parseTime(row.times[4]),
              ams_arr: parseTime(row.times[5]),
            },
            return: {
              ams_dep: parseTime(row.times[6]),
              hdk_arr: parseTime(row.times[7]),
              bru_arr: parseTime(row.times[8]),
              bru_dep: parseTime(row.times[9]),
              wnh_arr: parseTime(row.times[10]),
              pno_arr: parseTime(row.times[11]),
            },
          },
        },
        e_roster: {
          status: 'Automatically_Created',
          visible: true,
          schedule: {
            outbound: {
              pno_dep: parseTime(row.times[0]),
              wnh_arr: parseTime(row.times[1]),
              bru_arr: parseTime(row.times[2]),
              bru_dep: parseTime(row.times[3]),
              hdk_arr: parseTime(row.times[4]),
              ams_arr: parseTime(row.times[5]),
            },
            return: {
              ams_dep: parseTime(row.times[6]),
              hdk_arr: parseTime(row.times[7]),
              bru_arr: parseTime(row.times[8]),
              bru_dep: parseTime(row.times[9]),
              wnh_arr: parseTime(row.times[10]),
              pno_arr: parseTime(row.times[11]),
            },
          },
        },
      },
      verification: {
        tam_tam_ok: true,
        e_roster_ok: true,
      },
    };
    
    imported.push(service);
  }
  
  return { services: imported, overwritten };
}
