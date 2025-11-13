import { useState } from "react";
import { TrainService, JourneySchedule, StationTime } from "@/data/trainData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AlertTriangle } from "lucide-react";

interface DiscrepancyPopupProps {
  service: TrainService;
  field: "tam_tam" | "e_roster";
}

interface StationDifference {
  station: string;
  direction: "outbound" | "return";
  totemTime: string;
  otherTime: string;
}

export function DiscrepancyPopup({ service, field }: DiscrepancyPopupProps) {
  const [open, setOpen] = useState(false);

  const totemSchedule = service.systems_data.totem_plus.schedule;
  const otherSchedule = field === "tam_tam" 
    ? service.systems_data.tam_tam.schedule 
    : service.systems_data.e_roster.schedule;

  const systemName = field === "tam_tam" ? "TamTam" : "eRoster";

  // Helper function to compare station times
  const compareStationTime = (time1?: StationTime, time2?: StationTime): boolean => {
    if (!time1 && !time2) return true;
    if (!time1 || !time2) return false;
    return time1.time === time2.time;
  };

  // Find all differences between schedules
  const findDifferences = (): StationDifference[] => {
    const differences: StationDifference[] = [];

    // Check outbound journey
    const checkOutbound = (station: keyof JourneySchedule["outbound"], label: string) => {
      const totemTime = totemSchedule.outbound[station];
      const otherTime = otherSchedule.outbound[station];
      if (!compareStationTime(totemTime, otherTime) && (totemTime || otherTime)) {
        differences.push({
          station: label,
          direction: "outbound",
          totemTime: totemTime?.time || "-",
          otherTime: otherTime?.time || "-"
        });
      }
    };

    checkOutbound("pno_dep", "PNO (dep)");
    checkOutbound("wnh_arr", "WNH (arr)");
    checkOutbound("bru_arr", "BRU (arr)");
    checkOutbound("bru_dep", "BRU (dep)");
    checkOutbound("hdk_arr", "HDK (arr)");
    checkOutbound("ams_arr", "AMS (arr)");

    // Check return journey
    const checkReturn = (station: keyof JourneySchedule["return"], label: string) => {
      const totemTime = totemSchedule.return[station];
      const otherTime = otherSchedule.return[station];
      if (!compareStationTime(totemTime, otherTime) && (totemTime || otherTime)) {
        differences.push({
          station: label,
          direction: "return",
          totemTime: totemTime?.time || "-",
          otherTime: otherTime?.time || "-"
        });
      }
    };

    checkReturn("ams_dep", "AMS (dep)");
    checkReturn("hdk_arr", "HDK (arr)");
    checkReturn("bru_arr", "BRU (arr)");
    checkReturn("bru_dep", "BRU (dep)");
    checkReturn("wnh_arr", "WNH (arr)");
    checkReturn("pno_arr", "PNO (arr)");

    return differences;
  };

  const differences = findDifferences();

  // If no differences, don't show the popup trigger
  if (differences.length === 0) {
    return null;
  }

  return (
    <>
      <button
        onClick={(e) => {
          e.stopPropagation();
          setOpen(true);
        }}
        className="flex items-center justify-center p-2 hover:bg-muted/50 rounded transition-colors"
      >
        <AlertTriangle className="h-4 w-4 text-yellow-500" />
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-500" />
              Schedule Discrepancy: {systemName}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              The following stations have different times between Totem+ and {systemName}:
            </p>

            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-2 font-semibold">Station</th>
                    <th className="text-center p-2 font-semibold">Totem+</th>
                    <th className="text-center p-2 font-semibold">{systemName}</th>
                  </tr>
                </thead>
                <tbody>
                  {differences.map((diff, index) => (
                    <tr key={index} className="border-t">
                      <td className="p-2">
                        <span className="font-mono">{diff.direction === "outbound" ? "→" : "←"} {diff.station}</span>
                      </td>
                      <td className="p-2 text-center font-mono">
                        {diff.totemTime}
                      </td>
                      <td className="p-2 text-center">
                        <span className="font-mono px-2 py-1 rounded bg-red-900/50 text-yellow-400">
                          {diff.otherTime}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <p className="text-xs text-muted-foreground">
              Times highlighted in yellow indicate discrepancies that need to be resolved.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
