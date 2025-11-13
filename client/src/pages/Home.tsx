import { useState, useMemo } from "react";
import { trainData, periods as initialPeriods, TrainService, StationTime, Period } from "@/data/trainData";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Check, X, AlertTriangle, Edit, Moon, Sun, Filter, RotateCcw, Maximize2, Minimize2, AlertCircle } from "lucide-react";
import { ServiceDetailDialog } from "@/components/ServiceDetailDialog";
import { DiscrepancyTooltip } from "@/components/DiscrepancyTooltip";
import { DiscrepancyPopup } from "@/components/DiscrepancyPopup";
import { ExpandableTrainRow } from "@/components/ExpandableTrainRow";
import { DateDetailsPopup } from "@/components/DateDetailsPopup";
import { useTheme } from "@/contexts/ThemeContext";
import { hasTamTamDiscrepancy, hasERosterDiscrepancy, isTamTamMissingData, isERosterMissingData } from "@/lib/scheduleComparison";
import { parseCSV, extractRegimeSchedules, rolloutRegimeToActualServices, importScheduledTrains } from "@/lib/periodImport";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type DiscrepancyFilter = "all" | "any_discrepancy" | "eroster_only" | "tamtam_only";

// Helper function to determine day of week from service
type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

const getDayOfWeek = (service: TrainService): DayOfWeek | 'bonus' | null => {
  // Check if it's a bonus train
  if (service.service_id.startsWith('bonus-')) {
    return 'bonus';
  }
  
  // For régimé services (no date), extract day from service_id
  if (!service.date) {
    const days: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    for (const day of days) {
      if (service.service_id.includes(day)) return day;
    }
    return null;
  }
  
  // For actual services, check the date
  const date = new Date(service.date);
  const dayNum = date.getDay(); // 0=Sunday, 1=Monday, ..., 6=Saturday
  const dayMap: DayOfWeek[] = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return dayMap[dayNum];
};

export default function Home() {
  const [periods, setPeriods] = useState<Period[]>(initialPeriods);
  const [selectedPeriodId, setSelectedPeriodId] = useState<string>(periods[0]?.id || "2025-x1");
  const selectedPeriod = useMemo(() => periods.find(p => p.id === selectedPeriodId) || periods[0], [selectedPeriodId, periods]);
  const [services, setServices] = useState(trainData);
  const [selectedService, setSelectedService] = useState<TrainService | null>(null);
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [dialogOpen, setDialogOpen] = useState(false);
  const [simulationMode, setSimulationMode] = useState(false);
  const [csvImportOpen, setCsvImportOpen] = useState(false);
  const [scheduledImportOpen, setScheduledImportOpen] = useState(false);
  const [periodImportOpen, setPeriodImportOpen] = useState(false);
  const [periodMode, setPeriodMode] = useState<'add' | 'reset' | 'delete'>('add');
  const [autoRollout, setAutoRollout] = useState(true);
  const [newPeriodName, setNewPeriodName] = useState('');
  const [newPeriodStart, setNewPeriodStart] = useState('');
  const [newPeriodEnd, setNewPeriodEnd] = useState('');
  const [periodCsvInput, setPeriodCsvInput] = useState('');
  const [csvInput, setCsvInput] = useState("");
  const [scheduledCsvInput, setScheduledCsvInput] = useState("");
  const [copyToTamTam, setCopyToTamTam] = useState(true);
  const [copyToERoster, setCopyToERoster] = useState(true);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState<string | null>(null);
  const [overwriteWarning, setOverwriteWarning] = useState<{trains: string[], onConfirm: () => void} | null>(null);
  const [weekFilter, setWeekFilter] = useState<string>("all");
  const [discrepancyFilter, setDiscrepancyFilter] = useState<DiscrepancyFilter>("all");
  const [viewMode, setViewMode] = useState<"grouped" | "spreadsheet" | "calendar">("grouped");
  // Dynamic day colors - bright random colors for each day
  const [dayColors, setDayColors] = useState<Record<string, string>>({
    monday: "#3b82f6",    // blue-500
    tuesday: "#8b5cf6",   // violet-500
    wednesday: "#10b981", // emerald-500
    thursday: "#f59e0b",  // amber-500
    friday: "#ec4899",    // pink-500
    saturday: "#f97316",  // orange-500
    sunday: "#ef4444",    // red-500
    bonus: "#ca8a04"      // yellow-700 (dark yellow for bonus trains)
  });
  const [regimeFilter, setRegimeFilter] = useState<Record<string, boolean>>({});
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [datePopupOpen, setDatePopupOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();

  const handleClearFilters = () => {
    setWeekFilter("all");
    setDiscrepancyFilter("all");
  };

  const hasActiveFilters = weekFilter !== "all" || discrepancyFilter !== "all";

  // Calculate date ranges
  const today = new Date();
  const getWeekRange = (weeks: number) => {
    const end = new Date(today);
    end.setDate(end.getDate() + (weeks * 7));
    return end;
  };

  // Filter services by period date range first, then by week filter
  const filteredByDate = useMemo(() => {
    // First filter by period
    const periodStart = new Date(selectedPeriod.start_date);
    const periodEnd = new Date(selectedPeriod.end_date);
    
    // Combine actual services with bonus trains (only if bonus filter is enabled)
    const bonusTrainsToInclude = (regimeFilter['bonus'] ?? true) ? selectedPeriod.bonus_trains : [];
    const allServices = [...selectedPeriod.actual_services, ...bonusTrainsToInclude];
    
    const periodServices = allServices.filter(service => {
      if (!service.date) return false;
      const serviceDate = new Date(service.date);
      return serviceDate >= periodStart && serviceDate <= periodEnd;
    });
    
    // Then apply week filter if not "all"
    if (weekFilter === "all") return periodServices;
    
    let startDate = today;
    let endDate: Date;
    
    switch (weekFilter) {
      case "1":
        endDate = getWeekRange(1);
        break;
      case "2":
        endDate = getWeekRange(2);
        break;
      case "4":
        endDate = getWeekRange(4);
        break;
      case "8":
        endDate = getWeekRange(8);
        break;
      case "4-8":
        startDate = getWeekRange(4);
        endDate = getWeekRange(8);
        break;
      default:
        return periodServices;
    }
    
    return periodServices.filter(service => {
      if (!service.date) return false;
      const serviceDate = new Date(service.date);
      return serviceDate >= startDate && serviceDate <= endDate;
    });
  }, [selectedPeriod, weekFilter, regimeFilter]);

  // Filter services by régime (day of week)
  const filteredByRegime = useMemo(() => {
    return filteredByDate.filter(service => {
      const dayOfWeek = getDayOfWeek(service);
      if (!dayOfWeek) return true; // Keep services without a day
      // If filter is defined for this day, use it; otherwise default to true
      return regimeFilter[dayOfWeek] ?? true;
    });
  }, [filteredByDate, regimeFilter]);

  // Filter services by discrepancy type
  const filteredServices = useMemo(() => {
    let services = discrepancyFilter === "all" ? filteredByRegime : filteredByRegime.filter(service => {
      const hasTamTamIssue = hasTamTamDiscrepancy(
        service.systems_data.totem_plus.schedule,
        service.systems_data.tam_tam.schedule
      ) || !service.systems_data.tam_tam.visible;
      
      const hasERosterIssue = hasERosterDiscrepancy(
        service.systems_data.totem_plus.schedule,
        service.systems_data.e_roster.schedule
      ) || !service.systems_data.e_roster.visible;
      
      const hasAnyDiscrepancy = hasTamTamIssue || hasERosterIssue;
      
      switch (discrepancyFilter) {
        case "any_discrepancy":
          return hasAnyDiscrepancy;
        case "eroster_only":
          return hasERosterIssue;
        case "tamtam_only":
          return hasTamTamIssue;
        default:
          return true;
      }
    });
    
    // Sort by date in chronological order
    return services.sort((a, b) => {
      if (!a.date || !b.date) return 0;
      return new Date(a.date).getTime() - new Date(b.date).getTime();
    });
  }, [filteredByRegime, discrepancyFilter]);

  // Calculate statistics
  const statistics = useMemo(() => {
    const total = filteredServices.length;
    const bonusTrains = filteredServices.filter(s => s.service_id.startsWith('bonus-')).length;
    const tamtamIssues = filteredServices.filter(s => 
      hasTamTamDiscrepancy(s.systems_data.totem_plus.schedule, s.systems_data.tam_tam.schedule) ||
      !s.systems_data.tam_tam.visible
    ).length;
    const erosterIssues = filteredServices.filter(s => 
      hasERosterDiscrepancy(s.systems_data.totem_plus.schedule, s.systems_data.e_roster.schedule) ||
      !s.systems_data.e_roster.visible
    ).length;
    const totalDiscrepancies = tamtamIssues + erosterIssues;
    
    return {
      total,
      bonusTrains,
      totalDiscrepancies,
      tamtamIssues,
      erosterIssues
    };
  }, [filteredServices]);

  // Group filtered services by date and sort chronologically
  const servicesByDate = useMemo(() => {
    const grouped = filteredServices.reduce((acc, service) => {
      const date = service.date || "unknown";
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(service);
      return acc;
    }, {} as Record<string, TrainService[]>);
    
    // Sort services within each date by first departure time
    Object.keys(grouped).forEach(date => {
      grouped[date].sort((a, b) => {
        const getFirstDepartureTime = (service: TrainService) => {
          const schedule = service.systems_data.totem_plus.schedule;
          // Find first non-empty time in outbound direction (PNO departure)
          if (schedule.outbound.pno_dep?.time) return schedule.outbound.pno_dep.time;
          // Otherwise check other outbound stations
          for (const station of Object.values(schedule.outbound)) {
            if (station?.time) return station.time;
          }
          // If no outbound times, check return direction
          for (const station of Object.values(schedule.return)) {
            if (station?.time) return station.time;
          }
          return "99:99"; // Put services with no times at the end
        };
        
        const timeA = getFirstDepartureTime(a);
        const timeB = getFirstDepartureTime(b);
        return timeA.localeCompare(timeB);
      });
    });
    
    return grouped;
  }, [filteredServices]);

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit', year: '2-digit' });
  };

  const toggleRowExpansion = (serviceId: string) => {
    setExpandedRows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(serviceId)) {
        newSet.delete(serviceId);
      } else {
        newSet.add(serviceId);
      }
      return newSet;
    });
  };

  const expandAll = () => {
    const allServiceIds = new Set(filteredServices.map(s => s.service_id));
    setExpandedRows(allServiceIds);
  };

  const collapseAll = () => {
    setExpandedRows(new Set());
  };

  const expandIssuesOnly = () => {
    const issueServiceIds = new Set(
      filteredServices
        .filter(service => {
          const hasTamTamIssue = hasTamTamDiscrepancy(
            service.systems_data.totem_plus.schedule,
            service.systems_data.tam_tam.schedule
          ) || !service.systems_data.tam_tam.visible;
          
          const hasERosterIssue = hasERosterDiscrepancy(
            service.systems_data.totem_plus.schedule,
            service.systems_data.e_roster.schedule
          ) || !service.systems_data.e_roster.visible;
          
          return hasTamTamIssue || hasERosterIssue;
        })
        .map(s => s.service_id)
    );
    setExpandedRows(issueServiceIds);
  };

  const handleServiceClick = (service: TrainService) => {
    if (!simulationMode) return;
    setSelectedService(service);
    setDialogOpen(true);
  };

  const handleCsvImport = () => {
    setImportError(null);
    setImportSuccess(null);
    
    try {
      // Parse CSV - support tab, comma, or semicolon separators
      const lines = csvInput.trim().split('\n');
      if (lines.length === 0) {
        setImportError("No data provided");
        return;
      }
      
      // Skip header line if it exists (contains "Date" or "Train")
      const dataLines = lines.filter(line => 
        !line.toLowerCase().includes('date') && 
        !line.toLowerCase().includes('train id')
      );
      
      if (dataLines.length === 0) {
        setImportError("No valid data rows found");
        return;
      }
      
      const imported: TrainService[] = [];
      
      for (const line of dataLines) {
        // Detect separator (tab, comma, or semicolon)
        const separator = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
        const columns = line.split(separator).map(col => col.trim());
        
        if (columns.length < 14) {
          setImportError(`Invalid format: Expected 14 columns, got ${columns.length}`);
          return;
        }
        
        const [dateStr, trainId, ...times] = columns;
        
        // Validate date format (YYYY-MM-DD)
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          setImportError(`Invalid date format: ${dateStr}. Use YYYY-MM-DD`);
          return;
        }
        
        // Check if date falls within selected period
        const periodStart = new Date(selectedPeriod.start_date);
        const periodEnd = new Date(selectedPeriod.end_date);
        if (date < periodStart || date > periodEnd) {
          setImportError(`Date ${dateStr} is outside period ${selectedPeriod.name} (${selectedPeriod.start_date} to ${selectedPeriod.end_date})`);
          return;
        }
        
        // Check for duplicate train number on same date
        const existingOnDate = [...selectedPeriod.actual_services, ...selectedPeriod.bonus_trains].filter(
          s => s.date === dateStr && s.train_info.train_number === trainId
        );
        if (existingOnDate.length > 0) {
          setImportError(`Train ${trainId} already exists on ${dateStr}`);
          return;
        }
        
        // Parse times (convert "-" to undefined StationTime)
        const parseTime = (t: string): StationTime | undefined => {
          if (t === "-" || t === "") return undefined;
          return { time: t };
        };
        
        const newService: TrainService = {
          service_id: `bonus-${trainId}-${dateStr}`,
          date: dateStr,
          period_id: selectedPeriod.id,
          train_info: {
            train_number: trainId,
            description: `Bonus train ${trainId}`,
            crew: {
              driver: 'Blue',
              train_manager: 'Red',
            },
          },
          systems_data: {
            totem_plus: {
              status: 'Manually_Created',
              visible: true,
              schedule: {
                outbound: {
                  pno_dep: parseTime(times[0]),
                  wnh_arr: parseTime(times[1]),
                  bru_arr: parseTime(times[2]),
                  bru_dep: parseTime(times[3]),
                  hdk_arr: parseTime(times[4]),
                  ams_arr: parseTime(times[5]),
                },
                return: {
                  ams_dep: parseTime(times[6]),
                  hdk_arr: parseTime(times[7]),
                  bru_arr: parseTime(times[8]),
                  bru_dep: parseTime(times[9]),
                  wnh_arr: parseTime(times[10]),
                  pno_arr: parseTime(times[11]),
                },
              },
            },
            tam_tam: copyToTamTam ? {
              status: 'Manually_Created',
              visible: true,
              schedule: {
                outbound: {
                  pno_dep: parseTime(times[0]),
                  wnh_arr: parseTime(times[1]),
                  bru_arr: parseTime(times[2]),
                  bru_dep: parseTime(times[3]),
                  hdk_arr: parseTime(times[4]),
                  ams_arr: parseTime(times[5]),
                },
                return: {
                  ams_dep: parseTime(times[6]),
                  hdk_arr: parseTime(times[7]),
                  bru_arr: parseTime(times[8]),
                  bru_dep: parseTime(times[9]),
                  wnh_arr: parseTime(times[10]),
                  pno_arr: parseTime(times[11]),
                },
              },
            } : {
              status: 'Not_Visible',
              visible: false,
              schedule: { outbound: {}, return: {} },
            },
            e_roster: copyToERoster ? {
              status: 'Manually_Created',
              visible: true,
              schedule: {
                outbound: {
                  pno_dep: parseTime(times[0]),
                  wnh_arr: parseTime(times[1]),
                  bru_arr: parseTime(times[2]),
                  bru_dep: parseTime(times[3]),
                  hdk_arr: parseTime(times[4]),
                  ams_arr: parseTime(times[5]),
                },
                return: {
                  ams_dep: parseTime(times[6]),
                  hdk_arr: parseTime(times[7]),
                  bru_arr: parseTime(times[8]),
                  bru_dep: parseTime(times[9]),
                  wnh_arr: parseTime(times[10]),
                  pno_arr: parseTime(times[11]),
                },
              },
            } : {
              status: 'Not_Visible',
              visible: false,
              schedule: { outbound: {}, return: {} },
            },
          },
          verification: {
            tam_tam_ok: copyToTamTam,
            e_roster_ok: copyToERoster,
          },
        };
        
        imported.push(newService);
      }
      
      // Add to period's bonus trains
      const updatedPeriod = {
        ...selectedPeriod,
        bonus_trains: [...selectedPeriod.bonus_trains, ...imported]
      };
      
      // Update periods array
      const updatedPeriods = periods.map(p => 
        p.id === selectedPeriod.id ? updatedPeriod : p
      );
      
      // Update state to trigger re-render
      setPeriods(updatedPeriods);
      
      setImportSuccess(`Successfully imported ${imported.length} bonus train(s)`);
      setCsvInput("");
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        setCsvImportOpen(false);
        setImportSuccess(null);
      }, 2000);
      
    } catch (error) {
      setImportError(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleScheduledCsvImport = () => {
    setImportError(null);
    setImportSuccess(null);
    
    try {
      const lines = scheduledCsvInput.trim().split('\n').filter(line => line.trim());
      
      if (lines.length === 0) {
        setImportError("Please paste CSV data");
        return;
      }
      
      // Skip header line if it exists
      const dataLines = lines.filter(line => 
        !line.toLowerCase().includes('date') && 
        !line.toLowerCase().includes('train id')
      );
      
      if (dataLines.length === 0) {
        setImportError("No valid data rows found");
        return;
      }
      
      const imported: TrainService[] = [];
      const incompatibleDates: {date: string, day: string}[] = [];
      const duplicates: string[] = [];
      let currentDate = ''; // Track current date for grouped format
      
      for (const line of dataLines) {
        const separator = line.includes('\t') ? '\t' : line.includes(';') ? ';' : ',';
        const columns = line.split(separator).map(col => col.trim());
        
        if (columns.length < 14) {
          setImportError(`Invalid format: Expected 14 columns, got ${columns.length}`);
          return;
        }
        
        let dateStr: string;
        let trainId: string;
        let times: string[];
        
        // Check if first column is a date or empty (grouped format)
        if (columns[0] && columns[0].match(/^\d{4}-\d{2}-\d{2}$/)) {
          // New date found - update current date
          currentDate = columns[0];
          dateStr = columns[0];
          trainId = columns[1];
          times = columns.slice(2);
        } else if (columns[0] === '' || !columns[0].match(/^\d{4}-\d{2}-\d{2}$/)) {
          // No date in first column - use current date
          if (!currentDate) {
            setImportError('First row must contain a date');
            return;
          }
          dateStr = currentDate;
          trainId = columns[0] || columns[1]; // Train ID might be in first or second column
          times = columns[0] ? columns.slice(1) : columns.slice(2);
        } else {
          dateStr = columns[0];
          trainId = columns[1];
          times = columns.slice(2);
        }
        
        // Validate date format
        const date = new Date(dateStr);
        if (isNaN(date.getTime())) {
          setImportError(`Invalid date format: ${dateStr}. Use YYYY-MM-DD`);
          return;
        }
        
        // Check if date falls within selected period
        const periodStart = new Date(selectedPeriod.start_date);
        const periodEnd = new Date(selectedPeriod.end_date);
        if (date < periodStart || date > periodEnd) {
          setImportError(`Date ${dateStr} is outside period ${selectedPeriod.name} (${selectedPeriod.start_date} to ${selectedPeriod.end_date})`);
          return;
        }
        
        // Check if date matches a régime day
        const dayOfWeek = getDayOfWeek({ service_id: '', date: dateStr } as TrainService);
        const availableRegimeDays: string[] = [];
        if (selectedPeriod.regime) {
          Object.keys(selectedPeriod.regime).forEach(day => {
            const regimeDay = selectedPeriod.regime[day as keyof typeof selectedPeriod.regime];
            if (regimeDay && regimeDay.length > 0) {
              availableRegimeDays.push(day);
            }
          });
        }
        
        if (!dayOfWeek || !availableRegimeDays.includes(dayOfWeek)) {
          const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
          const dayName = dayNames[date.getDay()];
          incompatibleDates.push({ date: dateStr, day: dayName });
        }
        
        // Check for duplicates
        const existingOnDate = selectedPeriod.actual_services.filter(
          s => s.date === dateStr && s.train_info.train_number === trainId
        );
        if (existingOnDate.length > 0) {
          duplicates.push(`Train ${trainId} on ${dateStr}`);
        }
        
        // Parse times
        const parseTime = (t: string): StationTime | undefined => {
          if (t === "-" || t === "") return undefined;
          return { time: t };
        };
        
        const newService: TrainService = {
          service_id: `actual-${trainId}-${dateStr}`,
          date: dateStr,
          period_id: selectedPeriod.id,
          train_info: {
            train_number: trainId,
            description: `Scheduled train ${trainId}`,
            crew: {
              driver: 'Blue',
              train_manager: 'Red',
            },
          },
          systems_data: {
            totem_plus: {
              status: 'Manually_Created',
              visible: true,
              schedule: {
                outbound: {
                  pno_dep: parseTime(times[0]),
                  wnh_arr: parseTime(times[1]),
                  bru_arr: parseTime(times[2]),
                  bru_dep: parseTime(times[3]),
                  hdk_arr: parseTime(times[4]),
                  ams_arr: parseTime(times[5]),
                },
                return: {
                  ams_dep: parseTime(times[6]),
                  hdk_arr: parseTime(times[7]),
                  bru_arr: parseTime(times[8]),
                  bru_dep: parseTime(times[9]),
                  wnh_arr: parseTime(times[10]),
                  pno_arr: parseTime(times[11]),
                },
              },
            },
            tam_tam: copyToTamTam ? {
              status: 'Manually_Created',
              visible: true,
              schedule: {
                outbound: {
                  pno_dep: parseTime(times[0]),
                  wnh_arr: parseTime(times[1]),
                  bru_arr: parseTime(times[2]),
                  bru_dep: parseTime(times[3]),
                  hdk_arr: parseTime(times[4]),
                  ams_arr: parseTime(times[5]),
                },
                return: {
                  ams_dep: parseTime(times[6]),
                  hdk_arr: parseTime(times[7]),
                  bru_arr: parseTime(times[8]),
                  bru_dep: parseTime(times[9]),
                  wnh_arr: parseTime(times[10]),
                  pno_arr: parseTime(times[11]),
                },
              },
            } : {
              status: 'Not_Visible',
              visible: false,
              schedule: { outbound: {}, return: {} },
            },
            e_roster: copyToERoster ? {
              status: 'Manually_Created',
              visible: true,
              schedule: {
                outbound: {
                  pno_dep: parseTime(times[0]),
                  wnh_arr: parseTime(times[1]),
                  bru_arr: parseTime(times[2]),
                  bru_dep: parseTime(times[3]),
                  hdk_arr: parseTime(times[4]),
                  ams_arr: parseTime(times[5]),
                },
                return: {
                  ams_dep: parseTime(times[6]),
                  hdk_arr: parseTime(times[7]),
                  bru_arr: parseTime(times[8]),
                  bru_dep: parseTime(times[9]),
                  wnh_arr: parseTime(times[10]),
                  pno_arr: parseTime(times[11]),
                },
              },
            } : {
              status: 'Not_Visible',
              visible: false,
              schedule: { outbound: {}, return: {} },
            },
          },
          verification: {
            tam_tam_ok: copyToTamTam,
            e_roster_ok: copyToERoster,
          },
        };
        
        imported.push(newService);
      }
      
      // Check for incompatible dates
      if (incompatibleDates.length > 0) {
        const dateList = incompatibleDates.map(d => `${d.date} (${d.day})`).join(', ');
        setImportError(`Cannot import: The following dates are not compatible with the period's régime schedule: ${dateList}`);
        return;
      }
      
      // Check for duplicates - show warning
      if (duplicates.length > 0) {
        setOverwriteWarning({
          trains: duplicates,
          onConfirm: () => {
            // Remove duplicates and add new ones
            const updatedServices = selectedPeriod.actual_services.filter(s => {
              const isDuplicate = imported.some(imp => 
                imp.date === s.date && imp.train_info.train_number === s.train_info.train_number
              );
              return !isDuplicate;
            });
            
            const updatedPeriod = {
              ...selectedPeriod,
              actual_services: [...updatedServices, ...imported]
            };
            
            const updatedPeriods = periods.map(p => 
              p.id === selectedPeriod.id ? updatedPeriod : p
            );
            
            setPeriods(updatedPeriods);
            setImportSuccess(`Successfully imported ${imported.length} scheduled train(s)`);
            setScheduledCsvInput("");
            
            setTimeout(() => {
              setScheduledImportOpen(false);
              setImportSuccess(null);
            }, 2000);
          }
        });
        return;
      }
      
      // No duplicates - proceed with import
      const updatedPeriod = {
        ...selectedPeriod,
        actual_services: [...selectedPeriod.actual_services, ...imported]
      };
      
      const updatedPeriods = periods.map(p => 
        p.id === selectedPeriod.id ? updatedPeriod : p
      );
      
      setPeriods(updatedPeriods);
      setImportSuccess(`Successfully imported ${imported.length} scheduled train(s)`);
      setScheduledCsvInput("");
      
      setTimeout(() => {
        setScheduledImportOpen(false);
        setImportSuccess(null);
      }, 2000);
      
    } catch (error) {
      setImportError(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handlePeriodImport = () => {
    setImportError(null);
    setImportSuccess(null);
    
    try {
      // Handle delete mode
      if (periodMode === 'delete') {
        // Prevent deletion of last period
        if (periods.length <= 1) {
          setImportError('Cannot delete the last period. At least one period must exist.');
          return;
        }
        
        // Remove the period
        const updatedPeriods = periods.filter(p => p.id !== selectedPeriod.id);
        setPeriods(updatedPeriods);
        
        // Switch to the first remaining period
        setSelectedPeriodId(updatedPeriods[0].id);
        
        setImportSuccess(`Successfully deleted period "${selectedPeriod.name}"`);
        
        // Close dialog after 2 seconds
        setTimeout(() => {
          setPeriodImportOpen(false);
          setImportSuccess(null);
        }, 2000);
        
        return;
      }
      
      // Validate inputs
      if (periodMode === 'add') {
        if (!newPeriodName.trim()) {
          setImportError('Please enter a period name');
          return;
        }
        if (!newPeriodStart || !newPeriodEnd) {
          setImportError('Please select start and end dates');
          return;
        }
        
        // Validate date range
        const start = new Date(newPeriodStart);
        const end = new Date(newPeriodEnd);
        if (start >= end) {
          setImportError('End date must be after start date');
          return;
        }
        
        // Check if period already exists
        const exists = periods.find(p => p.id === newPeriodName);
        if (exists) {
          setImportError(`Period "${newPeriodName}" already exists`);
          return;
        }
      }
      
      // CSV validation and processing (only for add/reset modes)
      if (!periodCsvInput.trim()) {
        setImportError('Please paste CSV data');
        return;
      }
      
      // Step 1: Parse CSV data
      const parsedRows = parseCSV(periodCsvInput);
      
      // Step 2: Extract régime schedules
      const regime = extractRegimeSchedules(parsedRows);
      
      // Determine period details
      const periodId = periodMode === 'add' ? newPeriodName : selectedPeriod.id;
      const startDate = periodMode === 'add' ? newPeriodStart : selectedPeriod.start_date;
      const endDate = periodMode === 'add' ? newPeriodEnd : selectedPeriod.end_date;
      
      // Step 3: Auto roll-out (if enabled)
      let actualServices: TrainService[] = [];
      if (autoRollout) {
        actualServices = rolloutRegimeToActualServices(regime, startDate, endDate, periodId);
      }
      
      // Step 4: Import scheduled trains (overrides rolled-out schedules)
      const { services: scheduledServices, overwritten } = importScheduledTrains(
        parsedRows,
        periodId,
        actualServices
      );
      
      // Merge scheduled trains with rolled-out services
      if (overwritten.length > 0) {
        // Remove overwritten services
        actualServices = actualServices.filter(s => {
          const isOverwritten = scheduledServices.some(scheduled => 
            scheduled.date === s.date && scheduled.train_info.train_number === s.train_info.train_number
          );
          return !isOverwritten;
        });
      }
      
      // Add scheduled trains
      actualServices = [...actualServices, ...scheduledServices];
      
      // Separate bonus trains from actual services
      // Bonus trains are trains on days that are NOT in the régime
      const bonusTrains: TrainService[] = [];
      const regimeDays = Object.keys(regime) as Array<keyof typeof regime>;
      
      actualServices = actualServices.filter(service => {
        if (!service.date) return true; // Keep régime rows
        
        const serviceDate = new Date(service.date);
        const dayOfWeek = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][serviceDate.getDay()] as keyof typeof regime;
        
        // If this day is NOT in the régime, it's a bonus train
        if (!regimeDays.includes(dayOfWeek)) {
          // Change service_id prefix from 'actual-' to 'bonus-'
          const bonusService = {
            ...service,
            service_id: service.service_id.replace(/^actual-/, 'bonus-')
          };
          bonusTrains.push(bonusService);
          return false; // Remove from actual_services
        }
        
        return true; // Keep in actual_services
      });
      
      // Step 5: Create or update period
      if (periodMode === 'add') {
        const newPeriod: Period = {
          id: periodId,
          name: newPeriodName,
          start_date: startDate,
          end_date: endDate,
          regime,
          bonus_trains: bonusTrains,
          actual_services: actualServices,
        };
        
        setPeriods([...periods, newPeriod]);
        setSelectedPeriodId(periodId);
        setImportSuccess(`Successfully created period "${newPeriodName}" with ${Object.keys(regime).length} régime day(s), ${actualServices.length} actual service(s), and ${bonusTrains.length} bonus train(s)`);
      } else {
        // Reset existing period
        const updatedPeriod: Period = {
          ...selectedPeriod,
          regime,
          actual_services: actualServices,
          bonus_trains: bonusTrains,
        };
        
        const updatedPeriods = periods.map(p => 
          p.id === selectedPeriod.id ? updatedPeriod : p
        );
        
        setPeriods(updatedPeriods);
        setImportSuccess(`Successfully reset period "${selectedPeriod.name}" with ${Object.keys(regime).length} régime day(s), ${actualServices.length} actual service(s), and ${bonusTrains.length} bonus train(s)`);
      }
      
      // Clear form
      setPeriodCsvInput('');
      if (periodMode === 'add') {
        setNewPeriodName('');
        setNewPeriodStart('');
        setNewPeriodEnd('');
      }
      
      // Close dialog after 2 seconds
      setTimeout(() => {
        setPeriodImportOpen(false);
        setImportSuccess(null);
      }, 2000);
      
    } catch (error) {
      setImportError(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  const handleServiceUpdate = (updatedService: TrainService) => {
    setServices(prev => ({
      ...prev,
      actual: prev.actual.map(s => 
        s.service_id === updatedService.service_id ? updatedService : s
      )
    }));
  };

  const renderTime = (stationTime?: StationTime, service?: TrainService, direction?: "outbound" | "return", station?: string) => {
    if (!stationTime) return <span className="text-muted-foreground text-xs">-</span>;
    
    // Determine if time is changed by comparing with régimé
    let isChanged = stationTime.changed || false;
    
    // For actual services (not régimé), compare against régimé schedule
    if (service && service.date && direction && station) {
      const allRegimeServices = Object.values(selectedPeriod.regime).flatMap(services => services || []);
      const regimeService = allRegimeServices.find(
        (rs: TrainService) => rs.train_info.train_number === service.train_info.train_number
      );
      
      if (regimeService) {
        const regimeSchedule = regimeService.systems_data.totem_plus.schedule;
        const regimeTime = (regimeSchedule[direction] as any)[station];
        
        if (regimeTime && regimeTime.time !== stationTime.time) {
          isChanged = true;
        }
      }
    }
    
    // Changed times: dark background with yellow text
    if (isChanged) {
      return (
        <span className="text-xs bg-gray-900 text-yellow-400 px-1.5 py-0.5 rounded font-medium">
          {stationTime.time}
        </span>
      );
    }
    
    // Border crossing: dimmer red italic
    if (stationTime.border_crossing) {
      return (
        <span className="text-xs text-red-400/70 italic">
          {stationTime.time}
        </span>
      );
    }
    
    // Normal time
    return (
      <span className="text-xs">
        {stationTime.time}
      </span>
    );
  };

  const renderVerificationCell = (service: TrainService, field: "tam_tam" | "e_roster") => {
    // Check if data is missing (Totem+ has data but TamTam/eRoster doesn't)
    let isMissingData = false;
    if (field === "tam_tam") {
      isMissingData = isTamTamMissingData(
        service.systems_data.totem_plus.schedule,
        service.systems_data.tam_tam.schedule
      );
    } else if (field === "e_roster") {
      isMissingData = isERosterMissingData(
        service.systems_data.totem_plus.schedule,
        service.systems_data.e_roster.schedule
      );
    }

    // If data is missing, show red X
    if (isMissingData) {
      return (
        <div className="flex items-center justify-center p-2">
          <X className="h-4 w-4 text-destructive" />
        </div>
      );
    }

    // Automatically detect schedule discrepancies
    let hasDiscrepancy = false;
    if (field === "tam_tam") {
      hasDiscrepancy = hasTamTamDiscrepancy(
        service.systems_data.totem_plus.schedule,
        service.systems_data.tam_tam.schedule
      );
    } else if (field === "e_roster") {
      hasDiscrepancy = hasERosterDiscrepancy(
        service.systems_data.totem_plus.schedule,
        service.systems_data.e_roster.schedule
      );
    }
    
    const isOk = !hasDiscrepancy && (field === "tam_tam" 
      ? service.systems_data.tam_tam.visible 
      : service.systems_data.e_roster.visible);
    
    const visible = field === "tam_tam" 
      ? service.systems_data.tam_tam.visible 
      : service.systems_data.e_roster.visible;

    // For schedule discrepancies, show clickable popup
    if (hasDiscrepancy && visible && (field === "tam_tam" || field === "e_roster")) {
      return <DiscrepancyPopup service={service} field={field} />;
    }

    const content = (
      <div className="flex items-center justify-center p-2">
        {!visible ? (
          <X className="h-4 w-4 text-destructive" />
        ) : isOk ? (
          <Check className="h-4 w-4 text-green-500" />
        ) : (
          <AlertTriangle className="h-4 w-4 text-yellow-500" />
        )}
      </div>
    );

    return (
      <DiscrepancyTooltip service={service} field={field}>
        {content}
      </DiscrepancyTooltip>
    );
  };

  const renderSpreadsheetView = () => {
    // Flatten all services with their dates for spreadsheet view
    const allServices = Object.entries(servicesByDate).flatMap(([date, dateServices]) =>
      dateServices.map(service => ({ ...service, displayDate: date }))
    );

    if (allServices.length === 0) {
      return <p className="text-center text-muted-foreground">No services match the selected filters</p>;
    }

    // Calculate date group info for rowspan
    const dateGroups = new Map<string, number>();
    allServices.forEach(service => {
      const count = dateGroups.get(service.displayDate) || 0;
      dateGroups.set(service.displayDate, count + 1);
    });

    // Track which service is first in each date group
    const firstInGroup = new Set<string>();
    const seenDates = new Set<string>();
    allServices.forEach(service => {
      if (!seenDates.has(service.displayDate)) {
        firstInGroup.add(service.service_id);
        seenDates.add(service.displayDate);
      }
    });

    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="text-left p-2 font-semibold sticky left-0 bg-card z-10">Date</th>
              <th className="text-left p-2 font-semibold sticky left-[80px] bg-card z-10">Train</th>
              {/* Outbound Journey Headers */}
              <th colSpan={6} className="text-center p-2 font-semibold border-l-2 border-r-2 border-border bg-muted/30">
                Outbound (PNO → AMS)
              </th>
              {/* Return Journey Headers */}
              <th colSpan={6} className="text-center p-2 font-semibold border-r-2 border-border bg-muted/30">
                Return (AMS → PNO)
              </th>
              {/* Verification columns */}
              <th className="text-center p-2 font-semibold border-l-2 border-border">TamTam</th>
              <th className="text-center p-2 font-semibold">eRoster</th>
              {simulationMode && <th className="text-center p-2 font-semibold">Actions</th>}
            </tr>
            <tr className="border-b border-border text-xs">
              <th className="p-2 sticky left-0 bg-card z-10"></th>
              <th className="p-2 sticky left-[80px] bg-card z-10"></th>
              {/* Outbound station columns */}
              <th className="p-2 text-center border-l-2 border-border">PNO<br/>dep</th>
              <th className="p-2 text-center">WNH<br/>arr</th>
              <th className="p-2 text-center">BRU<br/>arr</th>
              <th className="p-2 text-center">BRU<br/>dep</th>
              <th className="p-2 text-center">HDK<br/>arr</th>
              <th className="p-2 text-center border-r-2 border-border">AMS<br/>arr</th>
              {/* Return station columns */}
              <th className="p-2 text-center">AMS<br/>dep</th>
              <th className="p-2 text-center">HDK<br/>arr</th>
              <th className="p-2 text-center">BRU<br/>arr</th>
              <th className="p-2 text-center">BRU<br/>dep</th>
              <th className="p-2 text-center">WNH<br/>arr</th>
              <th className="p-2 text-center border-r-2 border-border">PNO<br/>arr</th>
              {/* Verification */}
              <th className="p-2 border-l-2 border-border"></th>
              <th className="p-2"></th>
              <th className="p-2"></th>
              {simulationMode && <th className="p-2"></th>}
            </tr>
          </thead>
          <tbody>
            {allServices.map((service) => (
              <ExpandableTrainRow
                key={service.service_id}
                service={service}
                isExpanded={expandedRows.has(service.service_id)}
                onToggleExpand={() => toggleRowExpansion(service.service_id)}
                onEdit={() => handleServiceClick(service)}
                simulationMode={simulationMode}
                isRegime={false}
                renderTime={renderTime}
                renderVerificationCell={renderVerificationCell}
                showDate={true}
                dayOfWeek={getDayOfWeek(service)}
                displayDate={service.displayDate}
                isFirstInDateGroup={firstInGroup.has(service.service_id)}
                dateRowSpan={dateGroups.get(service.displayDate) || 1}
                dayColors={dayColors}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  // Helper to check if two journey schedules have any time differences
  const checkJourneyDifference = (journey1: any, journey2: any): boolean => {
    const keys = Object.keys(journey1);
    for (const key of keys) {
      const time1 = journey1[key]?.time;
      const time2 = journey2[key]?.time;
      
      // If one has a time and the other doesn't, or times are different
      if (time1 !== time2) {
        return true; // Found a difference
      }
    }
    return false; // No differences found
  };

  const renderCalendarView = () => {
    // Get all unique months from filtered services
    const months = new Set<string>();
    Object.keys(servicesByDate).forEach(dateStr => {
      const date = new Date(dateStr);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      months.add(monthKey);
    });

    const sortedMonths = Array.from(months).sort();

    if (sortedMonths.length === 0) {
      return <p className="text-center text-muted-foreground">No services match the selected filters</p>;
    }

    // Helper to get status for a specific date
    const getDateStatus = (dateStr: string) => {
      const dateServices = servicesByDate[dateStr];
      if (!dateServices || dateServices.length === 0) return null;

      let allPerfect = true;
      let hasScheduleChange = false;
      const systemStatus = {
        tamtam: { ok: true, missing: false, discrepancy: false },
        eroster: { ok: true, missing: false, discrepancy: false },
        vente: { ok: true, missing: false, discrepancy: false }
      };

      dateServices.forEach(service => {
        // Check TamTam
        if (isTamTamMissingData(service.systems_data.totem_plus.schedule, service.systems_data.tam_tam.schedule)) {
          systemStatus.tamtam.missing = true;
          systemStatus.tamtam.ok = false;
          allPerfect = false;
        } else if (hasTamTamDiscrepancy(service.systems_data.totem_plus.schedule, service.systems_data.tam_tam.schedule)) {
          systemStatus.tamtam.discrepancy = true;
          systemStatus.tamtam.ok = false;
          allPerfect = false;
        }

        // Check eRoster
        if (isERosterMissingData(service.systems_data.totem_plus.schedule, service.systems_data.e_roster.schedule)) {
          systemStatus.eroster.missing = true;
          systemStatus.eroster.ok = false;
          allPerfect = false;
        } else if (hasERosterDiscrepancy(service.systems_data.totem_plus.schedule, service.systems_data.e_roster.schedule)) {
          systemStatus.eroster.discrepancy = true;
          systemStatus.eroster.ok = false;
          allPerfect = false;
        }


      });

      // Check if any train has schedule changes (Totem+ differs from Régimé template)
      dateServices.forEach(service => {
        const dayOfWeek = getDayOfWeek(service);
        if (!dayOfWeek || dayOfWeek === 'bonus') return; // Skip bonus trains for regime comparison
        
        const regimeTemplates = selectedPeriod.regime[dayOfWeek as DayOfWeek];
        if (!regimeTemplates) return null;
        const regimeTemplate = regimeTemplates.find((t: TrainService) => 
          t.train_info.train_number === service.train_info.train_number
        );
        
        if (regimeTemplate) {
          // Compare Totem+ schedule with Régimé template - check for any time differences
          const totemSchedule = service.systems_data.totem_plus.schedule;
          const regimeSchedule = regimeTemplate.systems_data.totem_plus.schedule;
          
          // Check if any times differ between actual and template
          const outboundDiff = checkJourneyDifference(totemSchedule.outbound, regimeSchedule.outbound);
          const returnDiff = checkJourneyDifference(totemSchedule.return, regimeSchedule.return);
          
          if (outboundDiff || returnDiff) {
            hasScheduleChange = true;
          }
        }
      });

      return { allPerfect, systemStatus, hasScheduleChange };
    };

    // Helper to render month calendar
    const renderMonth = (monthKey: string) => {
      const [year, month] = monthKey.split('-').map(Number);
      const monthDate = new Date(year, month - 1, 1);
      const monthName = monthDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

      // Get first day of month and number of days
      const firstDay = monthDate.getDay(); // 0 = Sunday
      const daysInMonth = new Date(year, month, 0).getDate();

      // Create calendar grid
      const weeks: (number | null)[][] = [];
      let currentWeek: (number | null)[] = new Array(7).fill(null);
      let dayCounter = 1;

      // Fill first week
      for (let i = firstDay; i < 7 && dayCounter <= daysInMonth; i++) {
        currentWeek[i] = dayCounter++;
      }
      weeks.push(currentWeek);

      // Fill remaining weeks
      while (dayCounter <= daysInMonth) {
        currentWeek = new Array(7).fill(null);
        for (let i = 0; i < 7 && dayCounter <= daysInMonth; i++) {
          currentWeek[i] = dayCounter++;
        }
        weeks.push(currentWeek);
      }

      return (
        <div key={monthKey} className="mb-8">
          <h3 className="text-lg font-semibold mb-4">{monthName}</h3>
          <div className="border border-border rounded-lg overflow-hidden">
            {/* Day headers */}
            <div className="grid grid-cols-7 bg-muted/50">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, idx) => {
                // Map day index to régime color
                // Map day index to day name and get color
                const dayMap = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
                const dayName = dayMap[idx];
                const underlineColor = dayColors[dayName] || 'transparent';
                
                return (
                  <div 
                    key={day} 
                    className="p-2 text-center text-xs font-semibold border-r border-border last:border-r-0"
                    style={{
                      borderBottom: `3px solid ${underlineColor}`
                    }}
                  >
                    {day}
                  </div>
                );
              })}
            </div>
            {/* Calendar grid */}
            {weeks.map((week, weekIdx) => (
              <div key={weekIdx} className="grid grid-cols-7 border-t border-border">
                {week.map((day, dayIdx) => {
                  if (day === null) {
                    return <div key={dayIdx} className="p-2 min-h-[80px] border-r border-border last:border-r-0 bg-muted/20" />;
                  }

                  const dateStr = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                  const status = getDateStatus(dateStr);

                  const handleDateClick = () => {
                    if (status) {
                      setSelectedDate(dateStr);
                      setDatePopupOpen(true);
                    }
                  };

                  return (
                    <div 
                      key={dayIdx} 
                      className={`p-2 min-h-[80px] border-r border-border last:border-r-0 relative ${
                        status ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''
                      }`}
                      onClick={handleDateClick}
                    >
                      <div 
                        className={`text-xs mb-1 font-semibold ${
                          status?.hasScheduleChange 
                            ? 'bg-black text-yellow-400 px-1.5 py-0.5 rounded inline-block' 
                            : 'text-muted-foreground'
                        }`}
                      >
                        {day}
                      </div>
                      {status && (
                        <div className="flex flex-col gap-1 items-center justify-center mt-2">
                          {status.allPerfect ? (
                            <Check className="h-6 w-6 text-green-500" />
                          ) : (
                            <div className="text-xs space-y-0.5">
                              <div className="flex items-center gap-1">
                                <span className="font-semibold">TT</span>
                                {status.systemStatus.tamtam.ok ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : status.systemStatus.tamtam.missing ? (
                                  <X className="h-3 w-3 text-destructive" />
                                ) : (
                                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-semibold">eR</span>
                                {status.systemStatus.eroster.ok ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : status.systemStatus.eroster.missing ? (
                                  <X className="h-3 w-3 text-destructive" />
                                ) : (
                                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                )}
                              </div>
                              <div className="flex items-center gap-1">
                                <span className="font-semibold">V</span>
                                {status.systemStatus.vente.ok ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <AlertTriangle className="h-3 w-3 text-yellow-500" />
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      );
    };

    return (
      <div>
        {sortedMonths.map(month => renderMonth(month))}
      </div>
    );
  };

  const renderScheduleTable = (serviceList: TrainService[], isRegime = false) => {
    return (
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="text-left p-2 font-semibold sticky left-0 bg-card z-10">Train</th>
              {/* Outbound Journey Headers */}
              <th colSpan={6} className="text-center p-2 font-semibold border-l-2 border-r-2 border-border bg-muted/30">
                Outbound (PNO → AMS)
              </th>
              {/* Return Journey Headers */}
              <th colSpan={6} className="text-center p-2 font-semibold border-r-2 border-border bg-muted/30">
                Return (AMS → PNO)
              </th>
              {/* Verification columns */}
              <th className="text-center p-2 font-semibold border-l-2 border-border">TamTam</th>
              <th className="text-center p-2 font-semibold">eRoster</th>
              {simulationMode && <th className="text-center p-2 font-semibold">Actions</th>}
            </tr>
            <tr className="border-b border-border text-xs">
              <th className="p-2 sticky left-0 bg-card z-10"></th>
              {/* Outbound station columns */}
              <th className="p-2 text-center border-l-2 border-border">PNO<br/>dep</th>
              <th className="p-2 text-center">WNH<br/>arr</th>
              <th className="p-2 text-center">BRU<br/>arr</th>
              <th className="p-2 text-center">BRU<br/>dep</th>
              <th className="p-2 text-center">HDK<br/>arr</th>
              <th className="p-2 text-center border-r-2 border-border">AMS<br/>arr</th>
              {/* Return station columns */}
              <th className="p-2 text-center">AMS<br/>dep</th>
              <th className="p-2 text-center">HDK<br/>arr</th>
              <th className="p-2 text-center">BRU<br/>arr</th>
              <th className="p-2 text-center">BRU<br/>dep</th>
              <th className="p-2 text-center">WNH<br/>arr</th>
              <th className="p-2 text-center border-r-2 border-border">PNO<br/>arr</th>
              {/* Verification */}
              <th className="p-2 border-l-2 border-border"></th>
              <th className="p-2"></th>
              <th className="p-2"></th>
              {simulationMode && <th className="p-2"></th>}
            </tr>
          </thead>
          <tbody>
            {serviceList.map((service) => (
              <ExpandableTrainRow
                key={service.service_id}
                service={service}
                isExpanded={expandedRows.has(service.service_id)}
                onToggleExpand={() => toggleRowExpansion(service.service_id)}
                onEdit={() => handleServiceClick(service)}
                simulationMode={simulationMode}
                isRegime={isRegime}
                renderTime={renderTime}
                renderVerificationCell={renderVerificationCell}
                dayOfWeek={getDayOfWeek(service)}
                dayColors={dayColors}
              />
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-[1800px] mx-auto space-y-6">
        <div className="flex items-start justify-between gap-4">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold">Train Service Tracking Tool</h1>
            <p className="text-muted-foreground">
              Verification of train services across Totem+, Tam Tam, and eRoster systems
            </p>
          </div>
          
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="icon"
              onClick={toggleTheme}
              className="shrink-0"
            >
              {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </Button>
            
            <Card className="p-4">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-3">
                  <Switch
                    id="simulation-mode"
                    checked={simulationMode}
                    onCheckedChange={setSimulationMode}
                  />
                  <Label htmlFor="simulation-mode" className="cursor-pointer font-semibold">
                    Simulation Mode
                  </Label>
                </div>
                {simulationMode && (
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setCsvImportOpen(true)}
                    >
                      Add Bonus
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setScheduledImportOpen(true)}
                    >
                      Add Scheduled
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => setPeriodImportOpen(true)}
                    >
                      Manage Periods
                    </Button>
                  </div>
                )}
                <div className="flex items-center gap-3">
                  <Label className="font-semibold">View:</Label>
                  <Select value={viewMode} onValueChange={(value: "grouped" | "spreadsheet" | "calendar") => setViewMode(value)}>
                    <SelectTrigger className="w-[140px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="grouped">Grouped</SelectItem>
                      <SelectItem value="spreadsheet">Spreadsheet</SelectItem>
                      <SelectItem value="calendar">Calendar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Filters and Statistics */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Filters */}
          <Card className="p-4 lg:col-span-2">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4" />
                <Label className="font-semibold">Filters</Label>
              </div>
              {hasActiveFilters && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleClearFilters}
                  className="h-8 gap-2"
                >
                  <RotateCcw className="h-3 w-3" />
                  Clear All
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="period-filter" className="text-sm">Period</Label>
                <Select value={selectedPeriodId} onValueChange={setSelectedPeriodId}>
                  <SelectTrigger id="period-filter">
                    <SelectValue placeholder="Select period">
                      {selectedPeriod.name}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {periods.map(period => (
                      <SelectItem key={period.id} value={period.id}>
                        <div className="flex items-center justify-between gap-8 w-full">
                          <span className="font-semibold">{period.name}</span>
                          <span className="text-xs text-muted-foreground">{period.start_date} to {period.end_date}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="text-xs text-muted-foreground">
                  {selectedPeriod.start_date} to {selectedPeriod.end_date}
                </div>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="week-filter" className="text-sm">Date Range</Label>
                <Select value={weekFilter} onValueChange={setWeekFilter}>
                  <SelectTrigger id="week-filter">
                    <SelectValue placeholder="Select range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Dates</SelectItem>
                    <SelectItem value="1">Next 1 Week</SelectItem>
                    <SelectItem value="2">Next 2 Weeks</SelectItem>
                    <SelectItem value="4">Next 4 Weeks</SelectItem>
                    <SelectItem value="8">Next 8 Weeks</SelectItem>
                    <SelectItem value="4-8">Weeks 4-8</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="discrepancy-filter" className="text-sm">Discrepancy Filter</Label>
                <Select value={discrepancyFilter} onValueChange={(v) => setDiscrepancyFilter(v as DiscrepancyFilter)}>
                  <SelectTrigger id="discrepancy-filter">
                    <SelectValue placeholder="Select filter" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Trains</SelectItem>
                    <SelectItem value="any_discrepancy">Trains with Discrepancies</SelectItem>
                    <SelectItem value="tamtam_only">TamTam Issues Only</SelectItem>
                    <SelectItem value="eroster_only">eRoster Issues Only</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Day Filters - Consolidated on one line */}
            {(() => {
              const availableDays = Object.keys(selectedPeriod.regime).filter(
                day => selectedPeriod.regime[day as keyof typeof selectedPeriod.regime]?.length! > 0
              );
              const hasBonusTrains = selectedPeriod.bonus_trains.length > 0;
              
              if (availableDays.length === 0 && !hasBonusTrains) return null;
              
              return (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex flex-wrap items-center gap-4">
                    {availableDays.map(day => (
                      <label key={day} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={regimeFilter[day] ?? true}
                          onChange={(e) => setRegimeFilter({...regimeFilter, [day]: e.target.checked})}
                          className="w-4 h-4"
                        />
                        <span className="text-sm capitalize">{day}</span>
                        <input
                          type="color"
                          value={dayColors[day] || "#6b7280"}
                          onChange={(e) => setDayColors({...dayColors, [day]: e.target.value})}
                          className="w-8 h-6 rounded border border-border cursor-pointer"
                          title={`Choose ${day} color`}
                        />
                      </label>
                    ))}
                    {hasBonusTrains && (
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={regimeFilter['bonus'] ?? true}
                          onChange={(e) => setRegimeFilter({...regimeFilter, bonus: e.target.checked})}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Bonus Trains</span>
                        <input
                          type="color"
                          value={dayColors['bonus'] || "#ca8a04"}
                          onChange={(e) => setDayColors({...dayColors, bonus: e.target.value})}
                          className="w-8 h-6 rounded border border-border cursor-pointer"
                          title="Choose bonus trains color"
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })()}
          </Card>



          {/* Statistics */}
          <Card className="p-4">
            <Label className="font-semibold mb-3 block">Statistics</Label>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Trains</span>
                <Badge variant="outline" className="font-mono">{statistics.total}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Bonus Trains</span>
                <Badge variant="secondary" className="font-mono">{statistics.bonusTrains}</Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Total Discrepancies</span>
                <Badge variant={statistics.totalDiscrepancies > 0 ? "destructive" : "outline"} className="font-mono">
                  {statistics.totalDiscrepancies}
                </Badge>
              </div>
              <div className="border-t pt-2 space-y-2">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">TamTam Issues</span>
                  <span className="font-mono">{statistics.tamtamIssues}</span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">eRoster Issues</span>
                  <span className="font-mono">{statistics.erosterIssues}</span>
                </div>

              </div>
            </div>
          </Card>
        </div>

        {/* Reference Schedule (Régimé) */}
        <Card className="p-6">
          <div className="space-y-4">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Régimé</h2>
            </div>
            {renderScheduleTable(
              Object.keys(selectedPeriod.regime).flatMap(day => 
                (regimeFilter[day] ?? true) ? (selectedPeriod.regime[day as keyof typeof selectedPeriod.regime] || []) : []
              ),
              true
            )}
          </div>
        </Card>

        {/* Bulk Row Controls */}
        <Card className="p-4">
          <div className="flex items-center gap-2 mb-3">
            <Label className="font-semibold">Row Expansion</Label>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={expandAll}
              className="gap-2"
            >
              <Maximize2 className="h-3 w-3" />
              Expand All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={collapseAll}
              className="gap-2"
            >
              <Minimize2 className="h-3 w-3" />
              Collapse All
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={expandIssuesOnly}
              className="gap-2"
            >
              <AlertCircle className="h-3 w-3" />
              Expand Issues Only
            </Button>
          </div>
        </Card>

        {/* Actual Services by Date */}
        {viewMode === "grouped" ? (
          // Grouped by date view
          Object.keys(servicesByDate).length === 0 ? (
            <Card className="p-6">
              <p className="text-center text-muted-foreground">No services match the selected filters</p>
            </Card>
          ) : (
            Object.entries(servicesByDate).map(([date, dateServices]) => (
              <Card key={date} className="p-6">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold">{formatDate(date)}</h2>
                    <Badge variant="outline">
                      {dateServices.length} train{dateServices.length !== 1 ? 's' : ''}
                    </Badge>
                  </div>
                  {renderScheduleTable(dateServices)}
                </div>
              </Card>
            ))
          )
        ) : viewMode === "spreadsheet" ? (
          // Spreadsheet view
          <Card className="p-6">
            {renderSpreadsheetView()}
          </Card>
        ) : (
          // Calendar view
          <Card className="p-6">
            {renderCalendarView()}
          </Card>
        )}

        {/* Legend */}
        <Card className="p-4">
          <div className="flex items-center gap-6 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <Check className="h-4 w-4 text-green-500" />
              <span>Verified & Consistent</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-500" />
              <span>Discrepancy Detected</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-4 w-4 text-destructive" />
              <span>Missing data</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-yellow-500/20 border border-yellow-500/30 rounded"></div>
              <span>Row with Issues</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-red-400/70 italic">10:09</span>
              <span>Border Crossing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs bg-gray-900 text-yellow-400 px-1.5 py-0.5 rounded font-medium">20:35</span>
              <span>Changed Time</span>
            </div>
            {simulationMode && (
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                <span>Click to Edit & Simulate</span>
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* Service Detail Dialog */}
      {simulationMode && (
        <ServiceDetailDialog
          service={selectedService}
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          onUpdate={handleServiceUpdate}
          regimeServices={Object.values(selectedPeriod.regime).flatMap(services => services || [])}
        />
      )}

      {/* CSV Import Dialog */}
      {simulationMode && (
        <Dialog open={csvImportOpen} onOpenChange={setCsvImportOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add Bonus Train</DialogTitle>
              <DialogDescription>
                Paste CSV data with tab, comma, or semicolon separators. Format:
                <br />
                <code className="text-xs bg-muted px-1 py-0.5 rounded">Date, Train id, PNO, WNH, BRU, BRU, HDK, AMS, AMS, HDK, BRU, BRU, WNH, PNO</code>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Textarea
                placeholder="2025-07-17&#9;9303&#9;06:18&#9;07:18&#9;07:44&#9;07:53&#9;08:45&#9;10:15&#9;-&#9;-&#9;-&#9;-&#9;-&#9;-"
                value={csvInput}
                onChange={(e) => setCsvInput(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="copy-tamtam" 
                    checked={copyToTamTam}
                    onCheckedChange={(checked) => setCopyToTamTam(checked as boolean)}
                  />
                  <Label htmlFor="copy-tamtam" className="cursor-pointer">Copy to TamTam</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="copy-eroster" 
                    checked={copyToERoster}
                    onCheckedChange={(checked) => setCopyToERoster(checked as boolean)}
                  />
                  <Label htmlFor="copy-eroster" className="cursor-pointer">Copy to eRoster</Label>
                </div>
              </div>
              
              {importError && (
                <div className="bg-destructive/10 text-destructive p-3 rounded border border-destructive/20">
                  {importError}
                </div>
              )}
              
              {importSuccess && (
                <div className="bg-green-500/10 text-green-600 p-3 rounded border border-green-500/20">
                  {importSuccess}
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setCsvImportOpen(false);
                  setCsvInput("");
                  setImportError(null);
                  setImportSuccess(null);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleCsvImport}>
                  Import
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Scheduled Train Import Dialog */}
      {simulationMode && (
        <Dialog open={scheduledImportOpen} onOpenChange={setScheduledImportOpen}>
          <DialogContent className="max-w-3xl">
            <DialogHeader>
              <DialogTitle>Add Scheduled Train</DialogTitle>
              <DialogDescription>
                Paste CSV data with tab, comma, or semicolon separators. Format:
                <br />
                <code className="text-xs bg-muted px-1 py-0.5 rounded">Date, Train id, PNO, WNH, BRU, BRU, HDK, AMS, AMS, HDK, BRU, BRU, WNH, PNO</code>
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <Textarea
                placeholder="2025-06-20&#9;9320&#9;09:43&#9;10:09&#9;-&#9;-&#9;-&#9;-&#9;-&#9;-&#9;-&#9;-&#9;-&#9;11:05"
                value={scheduledCsvInput}
                onChange={(e) => setScheduledCsvInput(e.target.value)}
                rows={6}
                className="font-mono text-sm"
              />
              
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="copy-tamtam-scheduled" 
                    checked={copyToTamTam}
                    onCheckedChange={(checked) => setCopyToTamTam(checked as boolean)}
                  />
                  <Label htmlFor="copy-tamtam-scheduled" className="cursor-pointer">Copy to TamTam</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Checkbox 
                    id="copy-eroster-scheduled" 
                    checked={copyToERoster}
                    onCheckedChange={(checked) => setCopyToERoster(checked as boolean)}
                  />
                  <Label htmlFor="copy-eroster-scheduled" className="cursor-pointer">Copy to eRoster</Label>
                </div>
              </div>
              
              {importError && (
                <div className="bg-destructive/10 text-destructive p-3 rounded border border-destructive/20">
                  {importError}
                </div>
              )}
              
              {importSuccess && (
                <div className="bg-green-500/10 text-green-600 p-3 rounded border border-green-500/20">
                  {importSuccess}
                </div>
              )}
              
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => {
                  setScheduledImportOpen(false);
                  setScheduledCsvInput("");
                  setImportError(null);
                  setImportSuccess(null);
                }}>
                  Cancel
                </Button>
                <Button onClick={handleScheduledCsvImport}>
                  Import
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Overwrite Warning Dialog */}
      {overwriteWarning && (
        <Dialog open={true} onOpenChange={() => setOverwriteWarning(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Overwrite Existing Trains?</DialogTitle>
              <DialogDescription>
                The following trains already exist and will be overwritten:
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-2">
              <ul className="list-disc list-inside text-sm">
                {overwriteWarning.trains.map((train, i) => (
                  <li key={i}>{train}</li>
                ))}
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOverwriteWarning(null)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={() => {
                overwriteWarning.onConfirm();
                setOverwriteWarning(null);
              }}>
                Overwrite
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      )}

      {/* Add/Reset Period Dialog */}
      <Dialog open={periodImportOpen} onOpenChange={setPeriodImportOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {periodMode === 'add' && 'Add New Period'}
              {periodMode === 'reset' && 'Reset Period'}
              {periodMode === 'delete' && 'Delete Period'}
            </DialogTitle>
            <DialogDescription>
              {periodMode === 'add' && 'Create a new period with régime schedules and optionally roll out scheduled trains.'}
              {periodMode === 'reset' && 'Reset the current period by replacing all régime schedules and actual services.'}
              {periodMode === 'delete' && 'Permanently delete the current period and all its data.'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            {/* Mode Selection */}
            <div className="space-y-2">
              <Label className="font-semibold">Action</Label>
              <RadioGroup value={periodMode} onValueChange={(value: 'add' | 'reset' | 'delete') => setPeriodMode(value)}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="add" id="mode-add" />
                  <Label htmlFor="mode-add" className="cursor-pointer font-normal">
                    Add new period - Create a new period with imported data
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="reset" id="mode-reset" />
                  <Label htmlFor="mode-reset" className="cursor-pointer font-normal">
                    Reset current period - Replace all data in {selectedPeriod.name}
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="delete" id="mode-delete" />
                  <Label htmlFor="mode-delete" className="cursor-pointer font-normal text-destructive">
                    Delete current period - Permanently remove {selectedPeriod.name}
                  </Label>
                </div>
              </RadioGroup>
            </div>

            {/* Period Information */}
            {periodMode !== 'delete' && (
            <div className="space-y-2">
              <Label className="font-semibold">Period Information</Label>
              <div className="grid grid-cols-3 gap-2">
                <div>
                  <Label htmlFor="period-name">Period Name</Label>
                  <Input
                    id="period-name"
                    placeholder="e.g., 2025-X3"
                    value={periodMode === 'reset' ? selectedPeriod.name : newPeriodName}
                    onChange={(e) => setNewPeriodName(e.target.value)}
                    disabled={periodMode === 'reset'}
                  />
                </div>
                <div>
                  <Label htmlFor="period-start">Start Date</Label>
                  <Input
                    id="period-start"
                    type="date"
                    value={periodMode === 'reset' ? selectedPeriod.start_date : newPeriodStart}
                    onChange={(e) => setNewPeriodStart(e.target.value)}
                    disabled={periodMode === 'reset'}
                  />
                </div>
                <div>
                  <Label htmlFor="period-end">End Date</Label>
                  <Input
                    id="period-end"
                    type="date"
                    value={periodMode === 'reset' ? selectedPeriod.end_date : newPeriodEnd}
                    onChange={(e) => setNewPeriodEnd(e.target.value)}
                    disabled={periodMode === 'reset'}
                  />
                </div>
              </div>
            </div>
            )}

            {/* CSV Input */}
            {periodMode !== 'delete' && (
            <div className="space-y-2">
              <Label htmlFor="period-csv" className="font-semibold">Paste CSV Data</Label>
              <DialogDescription className="text-xs">
                Format: Date, Train, PNO_dep, WNH_arr, WNH_dep, BRU_arr, BRU_dep, HDK_arr, HDK_dep, AMS_arr, AMS_dep, HDK_arr, HDK_dep, BRU_arr, BRU_dep, WNH_arr, WNH_dep, PNO_arr, Day
                <br />Supports grouped format (date on first row, subsequent rows inherit date)
              </DialogDescription>
              <Textarea
                id="period-csv"
                placeholder="Paste CSV data here..."
                value={periodCsvInput}
                onChange={(e) => setPeriodCsvInput(e.target.value)}
                className="font-mono text-xs min-h-[200px]"
              />
            </div>
            )}

            {/* Auto Roll-out Option */}
            {periodMode !== 'delete' && (
            <div className="flex items-center space-x-2">
              <Checkbox
                id="auto-rollout"
                checked={autoRollout}
                onCheckedChange={(checked) => setAutoRollout(checked as boolean)}
              />
              <Label htmlFor="auto-rollout" className="cursor-pointer">
                Automatically roll out régime schedules to all dates in period
              </Label>
            </div>
            )}

            {/* Delete Confirmation */}
            {periodMode === 'delete' && (
            <div className="bg-destructive/10 border border-destructive p-4 rounded-md space-y-2">
              <p className="font-semibold text-destructive">Warning: This action cannot be undone!</p>
              <p className="text-sm">You are about to permanently delete period <strong>{selectedPeriod.name}</strong> ({selectedPeriod.start_date} to {selectedPeriod.end_date}).</p>
              <p className="text-sm">This will remove:</p>
              <ul className="list-disc list-inside text-sm ml-2">
                <li>{Object.keys(selectedPeriod.regime).filter(day => selectedPeriod.regime[day as keyof typeof selectedPeriod.regime]?.length).length} régime day(s)</li>
                <li>{selectedPeriod.actual_services.length} actual service(s)</li>
                <li>{selectedPeriod.bonus_trains.length} bonus train(s)</li>
              </ul>
            </div>
            )}

            {/* Instructions */}
            {periodMode !== 'delete' && (
            <div className="bg-muted p-3 rounded-md text-sm space-y-2">
              <p className="font-semibold">How it works:</p>
              <ol className="list-decimal list-inside space-y-1">
                <li><strong>Step 1:</strong> Parse CSV data and validate format</li>
                <li><strong>Step 2:</strong> Import régime schedules (weekly templates) from CSV</li>
                <li><strong>Step 3:</strong> {autoRollout ? 'Automatically roll out régime to all dates in period' : 'Skip auto roll-out'}</li>
                <li><strong>Step 4:</strong> Import scheduled trains from CSV (overrides rolled-out schedules)</li>
                <li><strong>Step 5:</strong> {periodMode === 'add' ? 'Create new period' : 'Update current period'}</li>
              </ol>
            </div>
            )}
          </div>

          {importError && (
            <div className="bg-destructive/10 border border-destructive text-destructive px-3 py-2 rounded-md text-sm">
              {importError}
            </div>
          )}
          
          {importSuccess && (
            <div className="bg-green-500/10 border border-green-500 text-green-500 px-3 py-2 rounded-md text-sm">
              {importSuccess}
            </div>
          )}

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setPeriodImportOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handlePeriodImport}
              variant={periodMode === 'delete' ? 'destructive' : 'default'}
            >
              {periodMode === 'add' && 'Add Period'}
              {periodMode === 'reset' && 'Reset Period'}
              {periodMode === 'delete' && 'Delete Period'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Date Details Popup */}
      <DateDetailsPopup
        open={datePopupOpen}
        onOpenChange={setDatePopupOpen}
        date={selectedDate}
        services={selectedDate ? servicesByDate[selectedDate] || [] : []}
      />
    </div>
  );
}
