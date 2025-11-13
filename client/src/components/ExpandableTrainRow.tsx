import { TrainService, StationTime, JourneySchedule } from "@/data/trainData";
import { Button } from "@/components/ui/button";
import { Edit, ChevronDown, ChevronRight } from "lucide-react";
import { hasTamTamDiscrepancy, hasERosterDiscrepancy, hasScheduleData } from "@/lib/scheduleComparison";

interface ExpandableTrainRowProps {
  service: TrainService;
  isExpanded: boolean;
  onToggleExpand: () => void;
  onEdit: () => void;
  simulationMode: boolean;
  isRegime?: boolean;
  showDate?: boolean;
  displayDate?: string;
  isFirstInDateGroup?: boolean;
  dateRowSpan?: number;
  dayOfWeek?: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday' | 'bonus' | null;
  dayColors?: Record<string, string>;
  renderTime: (
    stationTime: StationTime | undefined,
    service: TrainService,
    direction: "outbound" | "return",
    station: string
  ) => React.ReactNode;
  renderVerificationCell: (
    service: TrainService,
    field: "tam_tam" | "e_roster"
  ) => React.ReactNode;
}

export function ExpandableTrainRow({
  service,
  isExpanded,
  onToggleExpand,
  onEdit,
  simulationMode,
  isRegime = false,
  showDate = false,
  displayDate,
  isFirstInDateGroup = false,
  dateRowSpan = 1,
  dayOfWeek = null,
  dayColors = {},
  
  renderTime,
  renderVerificationCell,
}: ExpandableTrainRowProps) {
  const hasTamTamIssue =
    hasTamTamDiscrepancy(
      service.systems_data.totem_plus.schedule,
      service.systems_data.tam_tam.schedule
    ) || !service.systems_data.tam_tam.visible;

  const hasERosterIssue =
    hasERosterDiscrepancy(
      service.systems_data.totem_plus.schedule,
      service.systems_data.e_roster.schedule
    ) || !service.systems_data.e_roster.visible;

  const hasDiscrepancy =
    hasTamTamIssue || hasERosterIssue;

  const totemSchedule = service.systems_data.totem_plus.schedule;
  const tamtamSchedule = service.systems_data.tam_tam.schedule;
  const erosterSchedule = service.systems_data.e_roster.schedule;

  // Check if system has any schedule data
  const tamtamHasData = hasScheduleData(tamtamSchedule);
  const erosterHasData = hasScheduleData(erosterSchedule);

  // Helper to render time with discrepancy highlighting
  const renderComparisonTime = (
    totemTime: StationTime | undefined,
    systemTime: StationTime | undefined,
    systemHasData: boolean
  ) => {
    // Only show X if Totem+ has data for this station but system doesn't
    if (totemTime?.time && !systemTime?.time) {
      return (
        <span className="text-xs px-2 py-0.5 rounded bg-red-900/50 text-yellow-400 font-mono">
          X
        </span>
      );
    }

    // If both have no data, show dash
    if (!totemTime?.time && !systemTime?.time) {
      return <span className="text-xs text-muted-foreground">-</span>;
    }

    // If system has time but Totem+ doesn't (shouldn't happen but handle it)
    if (!totemTime?.time && systemTime?.time) {
      return <span className="text-xs text-muted-foreground">-</span>;
    }

    const hasDiscrepancy =
      totemTime?.time !== systemTime?.time &&
      (totemTime?.time || systemTime?.time);

    if (!systemTime?.time) {
      return <span className="text-xs text-muted-foreground">-</span>;
    }

    const isBorderCrossing = systemTime.border_crossing;

    if (hasDiscrepancy) {
      return (
        <span className={`text-xs px-2 py-0.5 rounded bg-red-900/50 text-yellow-400 font-mono ${isBorderCrossing ? 'italic' : ''}`}>
          {systemTime.time}
        </span>
      );
    }

    return (
      <span className={`text-xs font-mono ${isBorderCrossing ? 'text-red-400/60 italic' : ''}`}>
        {systemTime.time}
      </span>
    );
  };

  return (
    <>
      {/* Main Totem+ Row */}
      <tr
        className={`border-b border-border/50 ${!isRegime ? 'cursor-pointer hover:bg-muted/30' : ''} transition-colors ${
          hasDiscrepancy ? "bg-yellow-500/10" : ""
        } ${
          dayOfWeek ? 'border-l-4' : ''
        }`}
        style={{
          borderLeftColor: dayOfWeek ? (dayColors[dayOfWeek] || undefined) : undefined
        }}
        onClick={!isRegime ? onToggleExpand : undefined}
      >
        {showDate && isFirstInDateGroup && (
          <td rowSpan={dateRowSpan} className="p-2 text-sm font-bold sticky left-0 bg-card z-10 border-r border-border align-top">
            {displayDate}
          </td>
        )}
        <td className={`p-2 ${showDate ? 'sticky left-[80px]' : 'sticky left-0'} bg-card z-10`}>
          <div className="flex items-center gap-2">
            {!isRegime && (
              isExpanded ? (
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              )
            )}
            <div className="font-mono font-semibold">
              {service.train_info.train_number}
            </div>
          </div>
        </td>
        {/* Outbound journey cells */}
        <td className="p-2 text-center border-l-2 border-border">
          {renderTime(totemSchedule.outbound.pno_dep, service, "outbound", "pno_dep")}
        </td>
        <td className="p-2 text-center">
          {renderTime(totemSchedule.outbound.wnh_arr, service, "outbound", "wnh_arr")}
        </td>
        <td className="p-2 text-center">
          {renderTime(totemSchedule.outbound.bru_arr, service, "outbound", "bru_arr")}
        </td>
        <td className="p-2 text-center">
          {renderTime(totemSchedule.outbound.bru_dep, service, "outbound", "bru_dep")}
        </td>
        <td className="p-2 text-center">
          {renderTime(totemSchedule.outbound.hdk_arr, service, "outbound", "hdk_arr")}
        </td>
        <td className="p-2 text-center border-r-2 border-border">
          {renderTime(totemSchedule.outbound.ams_arr, service, "outbound", "ams_arr")}
        </td>
        {/* Return journey cells */}
        <td className="p-2 text-center">
          {renderTime(totemSchedule.return.ams_dep, service, "return", "ams_dep")}
        </td>
        <td className="p-2 text-center">
          {renderTime(totemSchedule.return.hdk_arr, service, "return", "hdk_arr")}
        </td>
        <td className="p-2 text-center">
          {renderTime(totemSchedule.return.bru_arr, service, "return", "bru_arr")}
        </td>
        <td className="p-2 text-center">
          {renderTime(totemSchedule.return.bru_dep, service, "return", "bru_dep")}
        </td>
        <td className="p-2 text-center">
          {renderTime(totemSchedule.return.wnh_arr, service, "return", "wnh_arr")}
        </td>
        <td className="p-2 text-center border-r-2 border-border">
          {renderTime(totemSchedule.return.pno_arr, service, "return", "pno_arr")}
        </td>
        {/* Verification cells */}
        <td
          className={`p-1 border-l-2 border-border ${
            !isRegime && (hasTamTamIssue ? "bg-yellow-500/20" : "bg-green-500/10")
          }`}
        >
          {!isRegime && renderVerificationCell(service, "tam_tam")}
        </td>
        <td
          className={`p-1 ${
            !isRegime && (hasERosterIssue ? "bg-yellow-500/20" : "bg-green-500/10")
          }`}
        >
          {!isRegime && renderVerificationCell(service, "e_roster")}
        </td>

        {simulationMode && (
          <td className="p-2 text-center">
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                onEdit();
              }}
            >
              <Edit className="h-4 w-4" />
            </Button>
          </td>
        )}
      </tr>

      {/* Expanded TamTam Row */}
      {!isRegime && isExpanded && (
        <tr 
          className={`border-b border-border/30 bg-blue-500/5 ${
            dayOfWeek ? 'border-l-4' : ''
          }`}
          style={{
            borderLeftColor: dayOfWeek ? (dayColors[dayOfWeek] || undefined) : undefined
          }}
        >
          <td className={`p-2 pl-10 ${showDate ? 'sticky left-[80px]' : 'sticky left-0'} bg-card z-10`}>
            <div className="text-xs font-semibold text-blue-400">TamTam</div>
          </td>
          {/* Outbound */}
          <td className="p-2 text-center border-l-2 border-border">
            {renderComparisonTime(
              totemSchedule.outbound.pno_dep,
              tamtamSchedule.outbound.pno_dep,
              tamtamHasData
            )}
          </td>
          <td className="p-2 text-center">
            {renderComparisonTime(
              totemSchedule.outbound.wnh_arr,
              tamtamSchedule.outbound.wnh_arr,
              tamtamHasData
            )}
          </td>
          <td className="p-2 text-center">
            {renderComparisonTime(
              totemSchedule.outbound.bru_arr,
              tamtamSchedule.outbound.bru_arr,
              tamtamHasData
            )}
          </td>
          <td className="p-2 text-center">
            {renderComparisonTime(
              totemSchedule.outbound.bru_dep,
              tamtamSchedule.outbound.bru_dep,
              tamtamHasData
            )}
          </td>
          <td className="p-2 text-center">
            {renderComparisonTime(
              totemSchedule.outbound.hdk_arr,
              tamtamSchedule.outbound.hdk_arr,
              tamtamHasData
            )}
          </td>
          <td className="p-2 text-center border-r-2 border-border">
            {renderComparisonTime(
              totemSchedule.outbound.ams_arr,
              tamtamSchedule.outbound.ams_arr,
              tamtamHasData
            )}
          </td>
          {/* Return */}
          <td className="p-2 text-center">
            {renderComparisonTime(
              totemSchedule.return.ams_dep,
              tamtamSchedule.return.ams_dep,
              tamtamHasData
            )}
          </td>
          <td className="p-2 text-center">
            {renderComparisonTime(
              totemSchedule.return.hdk_arr,
              tamtamSchedule.return.hdk_arr,
              tamtamHasData
            )}
          </td>
          <td className="p-2 text-center">
            {renderComparisonTime(
              totemSchedule.return.bru_arr,
              tamtamSchedule.return.bru_arr,
              tamtamHasData
            )}
          </td>
          <td className="p-2 text-center">
            {renderComparisonTime(
              totemSchedule.return.bru_dep,
              tamtamSchedule.return.bru_dep,
              tamtamHasData
            )}
          </td>
          <td className="p-2 text-center">
            {renderComparisonTime(
              totemSchedule.return.wnh_arr,
              tamtamSchedule.return.wnh_arr,
              tamtamHasData
            )}
          </td>
          <td className="p-2 text-center border-r-2 border-border">
            {renderComparisonTime(
              totemSchedule.return.pno_arr,
              tamtamSchedule.return.pno_arr,
              tamtamHasData
            )}
          </td>
          {/* Empty verification cells */}
          <td className="p-2 text-center border-l-2 border-border"></td>
          <td className="p-2 text-center"></td>
          {simulationMode && <td className="p-2 text-center"></td>}
        </tr>
      )}

      {/* Expanded eRoster Row */}
      {!isRegime && isExpanded && (
        <tr 
          className={`border-b border-border/30 bg-purple-500/5 ${
            dayOfWeek ? 'border-l-4' : ''
          }`}
          style={{
            borderLeftColor: dayOfWeek ? (dayColors[dayOfWeek] || undefined) : undefined
          }}
        >
          <td className={`p-2 pl-10 ${showDate ? 'sticky left-[80px]' : 'sticky left-0'} bg-card z-10`}>
            <div className="text-xs font-semibold text-purple-400">eRoster</div>
          </td>
          {/* Outbound */}
          <td className="p-2 text-center border-l-2 border-border">
            {renderComparisonTime(
              totemSchedule.outbound.pno_dep,
              erosterSchedule.outbound.pno_dep,
              erosterHasData
            )}
          </td>
          <td className="p-2 text-center">
            {renderComparisonTime(
              totemSchedule.outbound.wnh_arr,
              erosterSchedule.outbound.wnh_arr,
              erosterHasData
            )}
          </td>
          <td className="p-2 text-center">
            {renderComparisonTime(
              totemSchedule.outbound.bru_arr,
              erosterSchedule.outbound.bru_arr,
              erosterHasData
            )}
          </td>
          <td className="p-2 text-center">
            {renderComparisonTime(
              totemSchedule.outbound.bru_dep,
              erosterSchedule.outbound.bru_dep,
              erosterHasData
            )}
          </td>
          <td className="p-2 text-center">
            {renderComparisonTime(
              totemSchedule.outbound.hdk_arr,
              erosterSchedule.outbound.hdk_arr,
              erosterHasData
            )}
          </td>
          <td className="p-2 text-center border-r-2 border-border">
            {renderComparisonTime(
              totemSchedule.outbound.ams_arr,
              erosterSchedule.outbound.ams_arr,
              erosterHasData
            )}
          </td>
          {/* Return */}
          <td className="p-2 text-center">
            {renderComparisonTime(
              totemSchedule.return.ams_dep,
              erosterSchedule.return.ams_dep,
              erosterHasData
            )}
          </td>
          <td className="p-2 text-center">
            {renderComparisonTime(
              totemSchedule.return.hdk_arr,
              erosterSchedule.return.hdk_arr,
              erosterHasData
            )}
          </td>
          <td className="p-2 text-center">
            {renderComparisonTime(
              totemSchedule.return.bru_arr,
              erosterSchedule.return.bru_arr,
              erosterHasData
            )}
          </td>
          <td className="p-2 text-center">
            {renderComparisonTime(
              totemSchedule.return.bru_dep,
              erosterSchedule.return.bru_dep,
              erosterHasData
            )}
          </td>
          <td className="p-2 text-center">
            {renderComparisonTime(
              totemSchedule.return.wnh_arr,
              erosterSchedule.return.wnh_arr,
              erosterHasData
            )}
          </td>
          <td className="p-2 text-center border-r-2 border-border">
            {renderComparisonTime(
              totemSchedule.return.pno_arr,
              erosterSchedule.return.pno_arr,
              erosterHasData
            )}
          </td>
          {/* Empty verification cells */}
          <td className="p-2 text-center border-l-2 border-border"></td>
          <td className="p-2 text-center"></td>
          {simulationMode && <td className="p-2 text-center"></td>}
        </tr>
      )}
    </>
  );
}
