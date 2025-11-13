import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { TrainService, StationTime } from "@/data/trainData";
import { Check, X, AlertTriangle } from "lucide-react";
import { hasTamTamDiscrepancy, hasERosterDiscrepancy, isTamTamMissingData, isERosterMissingData } from "@/lib/scheduleComparison";

interface DateDetailsPopupProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  date: string | null;
  services: TrainService[];
}

export function DateDetailsPopup({ open, onOpenChange, date, services }: DateDetailsPopupProps) {
  if (!date) return null;

  // Format date for display
  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  // Get verification status for a service
  const getVerificationStatus = (service: TrainService): {
    tamtam: 'ok' | 'discrepancy' | 'missing';
    eroster: 'ok' | 'discrepancy' | 'missing';
    vente: 'ok' | 'discrepancy' | 'missing';
  } => {
    const tamtamMissing = isTamTamMissingData(service.systems_data.totem_plus.schedule, service.systems_data.tam_tam.schedule);
    const tamtamDiscrepancy = hasTamTamDiscrepancy(service.systems_data.totem_plus.schedule, service.systems_data.tam_tam.schedule);
    const erosterMissing = isERosterMissingData(service.systems_data.totem_plus.schedule, service.systems_data.e_roster.schedule);
    const erosterDiscrepancy = hasERosterDiscrepancy(service.systems_data.totem_plus.schedule, service.systems_data.e_roster.schedule);
    const venteOk = service.verification.tam_tam_ok;

    return {
      tamtam: tamtamMissing ? 'missing' : tamtamDiscrepancy ? 'discrepancy' : 'ok',
      eroster: erosterMissing ? 'missing' : erosterDiscrepancy ? 'discrepancy' : 'ok',
      vente: venteOk ? 'ok' : 'discrepancy'
    };
  };

  // Render status icon
  const renderStatusIcon = (status: 'ok' | 'discrepancy' | 'missing') => {
    if (status === 'ok') {
      return <Check className="h-4 w-4 text-green-500" />;
    } else if (status === 'missing') {
      return <X className="h-4 w-4 text-destructive" />;
    } else {
      return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    }
  };

  // Render time with styling and comparison highlighting
  const renderTime = (stationTime: StationTime | undefined, compareTime?: StationTime | undefined) => {
    // Check for missing data: Totem+ has time but system doesn't
    const isMissing = compareTime?.time && !stationTime?.time;
    
    if (isMissing) {
      // Missing data - show X in red background
      return <span className="text-xs px-1 py-0.5 rounded bg-red-900/50 text-yellow-400 font-mono">X</span>;
    }
    
    if (!stationTime?.time) return <span className="text-muted-foreground text-xs">-</span>;
    
    const baseClasses = "text-xs";
    let classes = baseClasses;
    
    // Check if time differs from comparison (Totem+)
    const isDifferent = compareTime && compareTime.time !== stationTime.time;
    
    // Determine styling priority:
    // 1. Changed time (from Totem+ reference)
    // 2. Discrepancy (differs from Totem+)
    // 3. Border crossing (from Totem+ reference or inherent)
    
    if (false) {
      // Placeholder to maintain structure
    } else if (compareTime?.changed || stationTime.changed) {
      // Changed time - use Totem+ changed flag or own changed flag
      classes += " bg-gray-900 text-yellow-400 px-1.5 py-0.5 rounded font-medium";
    } else if (isDifferent) {
      // Discrepancy - show with red background like main table
      const isBorderCrossing = compareTime?.border_crossing || stationTime.border_crossing;
      classes += ` px-1 py-0.5 rounded bg-red-900/50 text-yellow-400 font-mono ${isBorderCrossing ? 'italic' : ''}`;
    } else if (compareTime?.border_crossing || stationTime.border_crossing) {
      // Border crossing - use Totem+ border_crossing flag or own flag
      classes += " text-red-400/70 italic";
    }
    
    return <span className={classes}>{stationTime.time}</span>;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[632px] max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Train Details for {formatDate(date)}</DialogTitle>
        </DialogHeader>
        <div className="space-y-6">
          {services.map((service) => {
            const status = getVerificationStatus(service);
            const totemSchedule = service.systems_data.totem_plus.schedule;
            const tamtamSchedule = service.systems_data.tam_tam.schedule;
            const erosterSchedule = service.systems_data.e_roster.schedule;
            
            return (
              <div key={service.service_id} className="border border-border rounded-lg p-4 space-y-3">
                {/* Train header with verification status */}
                <div className="flex items-center justify-between border-b border-border pb-2">
                  <h3 className="text-lg font-semibold">Train {service.train_info.train_number}</h3>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold">TT:</span>
                      {renderStatusIcon(status.tamtam)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold">eR:</span>
                      {renderStatusIcon(status.eroster)}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="text-xs font-semibold">V:</span>
                      {renderStatusIcon(status.vente)}
                    </div>
                  </div>
                </div>

                {/* Schedule details with comparison columns */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Outbound journey */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Outbound (PNO → AMS)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs table-fixed">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-1 pr-2 font-normal text-muted-foreground w-14"></th>
                            <th className="text-center py-1 px-2 font-normal text-muted-foreground">T+</th>
                            <th className="text-center py-1 px-2 font-semibold">TT</th>
                            <th className="text-center py-1 px-2 font-semibold">eR</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-1 pr-1 whitespace-nowrap text-left">PNO d:</td>
                            <td className="text-center py-1 px-1">{renderTime(totemSchedule.outbound.pno_dep)}</td>
                            <td className="text-center py-1 px-1">{renderTime(tamtamSchedule.outbound.pno_dep, totemSchedule.outbound.pno_dep)}</td>
                            <td className="text-center py-1 px-1">{renderTime(erosterSchedule.outbound.pno_dep, totemSchedule.outbound.pno_dep)}</td>

                          </tr>
                          <tr>
                            <td className="py-1 pr-1 whitespace-nowrap text-left">WNH a:</td>
                            <td className="text-center py-1 px-1">{renderTime(totemSchedule.outbound.wnh_arr)}</td>
                            <td className="text-center py-1 px-1">{renderTime(tamtamSchedule.outbound.wnh_arr, totemSchedule.outbound.wnh_arr)}</td>
                            <td className="text-center py-1 px-1">{renderTime(erosterSchedule.outbound.wnh_arr, totemSchedule.outbound.wnh_arr)}</td>

                          </tr>
                          <tr>
                            <td className="py-1 pr-1 whitespace-nowrap text-left">BRU a:</td>
                            <td className="text-center py-1 px-1">{renderTime(totemSchedule.outbound.bru_arr)}</td>
                            <td className="text-center py-1 px-1">{renderTime(tamtamSchedule.outbound.bru_arr, totemSchedule.outbound.bru_arr)}</td>
                            <td className="text-center py-1 px-1">{renderTime(erosterSchedule.outbound.bru_arr, totemSchedule.outbound.bru_arr)}</td>

                          </tr>
                          <tr>
                            <td className="py-1 pr-1 whitespace-nowrap text-left">BRU d:</td>
                            <td className="text-center py-1 px-1">{renderTime(totemSchedule.outbound.bru_dep)}</td>
                            <td className="text-center py-1 px-1">{renderTime(tamtamSchedule.outbound.bru_dep, totemSchedule.outbound.bru_dep)}</td>
                            <td className="text-center py-1 px-1">{renderTime(erosterSchedule.outbound.bru_dep, totemSchedule.outbound.bru_dep)}</td>

                          </tr>
                          <tr>
                            <td className="py-1 pr-1 whitespace-nowrap text-left">HDK a:</td>
                            <td className="text-center py-1 px-1">{renderTime(totemSchedule.outbound.hdk_arr)}</td>
                            <td className="text-center py-1 px-1">{renderTime(tamtamSchedule.outbound.hdk_arr, totemSchedule.outbound.hdk_arr)}</td>
                            <td className="text-center py-1 px-1">{renderTime(erosterSchedule.outbound.hdk_arr, totemSchedule.outbound.hdk_arr)}</td>

                          </tr>
                          <tr>
                            <td className="py-1 pr-1 whitespace-nowrap text-left">AMS a:</td>
                            <td className="text-center py-1 px-1">{renderTime(totemSchedule.outbound.ams_arr)}</td>
                            <td className="text-center py-1 px-1">{renderTime(tamtamSchedule.outbound.ams_arr, totemSchedule.outbound.ams_arr)}</td>
                            <td className="text-center py-1 px-1">{renderTime(erosterSchedule.outbound.ams_arr, totemSchedule.outbound.ams_arr)}</td>

                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Return journey */}
                  <div>
                    <h4 className="text-sm font-semibold mb-2 text-muted-foreground">Return (AMS → PNO)</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs table-fixed">
                        <thead>
                          <tr className="border-b border-border">
                            <th className="text-left py-1 pr-2 font-normal text-muted-foreground w-14"></th>
                            <th className="text-center py-1 px-2 font-normal text-muted-foreground">T+</th>
                            <th className="text-center py-1 px-2 font-semibold">TT</th>
                            <th className="text-center py-1 px-2 font-semibold">eR</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr>
                            <td className="py-1 pr-1 whitespace-nowrap text-left">AMS d:</td>
                            <td className="text-center py-1 px-1">{renderTime(totemSchedule.return.ams_dep)}</td>
                            <td className="text-center py-1 px-1">{renderTime(tamtamSchedule.return.ams_dep, totemSchedule.return.ams_dep)}</td>
                            <td className="text-center py-1 px-1">{renderTime(erosterSchedule.return.ams_dep, totemSchedule.return.ams_dep)}</td>

                          </tr>
                          <tr>
                            <td className="py-1 pr-1 whitespace-nowrap text-left">HDK a:</td>
                            <td className="text-center py-1 px-1">{renderTime(totemSchedule.return.hdk_arr)}</td>
                            <td className="text-center py-1 px-1">{renderTime(tamtamSchedule.return.hdk_arr, totemSchedule.return.hdk_arr)}</td>
                            <td className="text-center py-1 px-1">{renderTime(erosterSchedule.return.hdk_arr, totemSchedule.return.hdk_arr)}</td>

                          </tr>
                          <tr>
                            <td className="py-1 pr-1 whitespace-nowrap text-left">BRU a:</td>
                            <td className="text-center py-1 px-1">{renderTime(totemSchedule.return.bru_arr)}</td>
                            <td className="text-center py-1 px-1">{renderTime(tamtamSchedule.return.bru_arr, totemSchedule.return.bru_arr)}</td>
                            <td className="text-center py-1 px-1">{renderTime(erosterSchedule.return.bru_arr, totemSchedule.return.bru_arr)}</td>

                          </tr>
                          <tr>
                            <td className="py-1 pr-1 whitespace-nowrap text-left">BRU d:</td>
                            <td className="text-center py-1 px-1">{renderTime(totemSchedule.return.bru_dep)}</td>
                            <td className="text-center py-1 px-1">{renderTime(tamtamSchedule.return.bru_dep, totemSchedule.return.bru_dep)}</td>
                            <td className="text-center py-1 px-1">{renderTime(erosterSchedule.return.bru_dep, totemSchedule.return.bru_dep)}</td>

                          </tr>
                          <tr>
                            <td className="py-1 pr-1 whitespace-nowrap text-left">WNH a:</td>
                            <td className="text-center py-1 px-1">{renderTime(totemSchedule.return.wnh_arr)}</td>
                            <td className="text-center py-1 px-1">{renderTime(tamtamSchedule.return.wnh_arr, totemSchedule.return.wnh_arr)}</td>
                            <td className="text-center py-1 px-1">{renderTime(erosterSchedule.return.wnh_arr, totemSchedule.return.wnh_arr)}</td>

                          </tr>
                          <tr>
                            <td className="py-1 pr-1 whitespace-nowrap text-left">PNO a:</td>
                            <td className="text-center py-1 px-1">{renderTime(totemSchedule.return.pno_arr)}</td>
                            <td className="text-center py-1 px-1">{renderTime(tamtamSchedule.return.pno_arr, totemSchedule.return.pno_arr)}</td>
                            <td className="text-center py-1 px-1">{renderTime(erosterSchedule.return.pno_arr, totemSchedule.return.pno_arr)}</td>

                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}

          {/* Legend */}
          <div className="text-xs text-muted-foreground space-y-1 pt-2 border-t border-border">
            <div className="font-semibold mb-1">Status Indicators:</div>
            <div className="flex items-center gap-2">
              <Check className="h-3 w-3 text-green-500" />
              <span>OK - No issues</span>
            </div>
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-3 w-3 text-yellow-500" />
              <span>Discrepancy - Schedule mismatch</span>
            </div>
            <div className="flex items-center gap-2">
              <X className="h-3 w-3 text-destructive" />
              <span>Missing data - System has no schedule</span>
            </div>
            <div className="font-semibold mt-2 mb-1">Time Styling:</div>
            <div className="flex items-center gap-2">
              <span className="text-red-400/70 italic">13:18</span>
              <span>Border Crossing</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="bg-gray-900 text-yellow-400 px-1.5 py-0.5 rounded text-xs">20:35</span>
              <span>Changed Time</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-yellow-500 font-medium">14:30</span>
              <span>Discrepancy (differs from Totem+)</span>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
