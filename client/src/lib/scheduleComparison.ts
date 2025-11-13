import { JourneySchedule, StationTime } from "@/data/trainData";

/**
 * Compare two station times
 */
function compareStationTimes(time1?: StationTime, time2?: StationTime): boolean {
  // If both are undefined or null, they match
  if (!time1 && !time2) return true;
  
  // If only one is defined, they don't match
  if (!time1 || !time2) return false;
  
  // Compare the actual time strings
  return time1.time === time2.time;
}

/**
 * Compare two journey schedules and return true if they match
 */
export function compareSchedules(schedule1: JourneySchedule, schedule2: JourneySchedule): boolean {
  // Compare outbound journey
  const outbound1 = schedule1.outbound;
  const outbound2 = schedule2.outbound;
  
  if (!compareStationTimes(outbound1.pno_dep, outbound2.pno_dep)) return false;
  if (!compareStationTimes(outbound1.wnh_arr, outbound2.wnh_arr)) return false;
  if (!compareStationTimes(outbound1.bru_arr, outbound2.bru_arr)) return false;
  if (!compareStationTimes(outbound1.bru_dep, outbound2.bru_dep)) return false;
  if (!compareStationTimes(outbound1.hdk_arr, outbound2.hdk_arr)) return false;
  if (!compareStationTimes(outbound1.ams_arr, outbound2.ams_arr)) return false;
  
  // Compare return journey
  const return1 = schedule1.return;
  const return2 = schedule2.return;
  
  if (!compareStationTimes(return1.ams_dep, return2.ams_dep)) return false;
  if (!compareStationTimes(return1.hdk_arr, return2.hdk_arr)) return false;
  if (!compareStationTimes(return1.bru_arr, return2.bru_arr)) return false;
  if (!compareStationTimes(return1.bru_dep, return2.bru_dep)) return false;
  if (!compareStationTimes(return1.wnh_arr, return2.wnh_arr)) return false;
  if (!compareStationTimes(return1.pno_arr, return2.pno_arr)) return false;
  
  return true;
}

/**
 * Check if there's a discrepancy between Totem+ and TamTam schedules
 */
export function hasTamTamDiscrepancy(totemSchedule: JourneySchedule, tamtamSchedule: JourneySchedule): boolean {
  return !compareSchedules(totemSchedule, tamtamSchedule);
}

/**
 * Check if there's a discrepancy between Totem+ and eRoster schedules
 */
export function hasERosterDiscrepancy(totemSchedule: JourneySchedule, erosterSchedule: JourneySchedule): boolean {
  return !compareSchedules(totemSchedule, erosterSchedule);
}

/**
 * Check if a journey schedule has any time data
 */
export function hasScheduleData(schedule: JourneySchedule): boolean {
  // Check outbound journey
  if (schedule.outbound.pno_dep?.time) return true;
  if (schedule.outbound.wnh_arr?.time) return true;
  if (schedule.outbound.bru_arr?.time) return true;
  if (schedule.outbound.bru_dep?.time) return true;
  if (schedule.outbound.hdk_arr?.time) return true;
  if (schedule.outbound.ams_arr?.time) return true;
  
  // Check return journey
  if (schedule.return.ams_dep?.time) return true;
  if (schedule.return.hdk_arr?.time) return true;
  if (schedule.return.bru_arr?.time) return true;
  if (schedule.return.bru_dep?.time) return true;
  if (schedule.return.wnh_arr?.time) return true;
  if (schedule.return.pno_arr?.time) return true;
  
  return false;
}

/**
 * Check if TamTam is missing data when Totem+ has data
 */
export function isTamTamMissingData(
  totemSchedule: JourneySchedule,
  tamtamSchedule: JourneySchedule
): boolean {
  return hasScheduleData(totemSchedule) && !hasScheduleData(tamtamSchedule);
}

/**
 * Check if eRoster is missing data when Totem+ has data
 */
export function isERosterMissingData(
  totemSchedule: JourneySchedule,
  erosterSchedule: JourneySchedule
): boolean {
  return hasScheduleData(totemSchedule) && !hasScheduleData(erosterSchedule);
}
