import { useState, useMemo, useRef, useEffect } from "react";
import { TrainService, StationTime } from "@/data/trainData";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";
import { VisuallyHidden } from "@radix-ui/react-visually-hidden";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { GripHorizontal } from "lucide-react";

interface ServiceDetailDialogProps {
  service: TrainService | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdate: (updatedService: TrainService) => void;
  regimeServices: TrainService[];
}

export function ServiceDetailDialog({
  service,
  open,
  onOpenChange,
  onUpdate,
  regimeServices,
}: ServiceDetailDialogProps) {
  const [editedService, setEditedService] = useState<TrainService | null>(service);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Find the corresponding régimé service for comparison (must be before early return)
  const regimeService = useMemo(() => {
    if (!service || !service.date) return null; // Only for actual services
    return regimeServices.find(
      (rs) => rs.train_info.train_number === service.train_info.train_number
    );
  }, [service, regimeServices]);

  // Reset position when dialog opens
  useEffect(() => {
    if (open) {
      setPosition({ x: 0, y: 0 });
    }
  }, [open]);

  // Drag event listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (isDragging) {
        const newX = e.clientX - dragStart.x;
        const newY = e.clientY - dragStart.y;
        
        const maxX = window.innerWidth - 400;
        const maxY = window.innerHeight - 200;
        
        setPosition({
          x: Math.max(-200, Math.min(newX, maxX)),
          y: Math.max(-100, Math.min(newY, maxY)),
        });
      }
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, position]);

  // Update local state when service prop changes
  if (service && editedService?.service_id !== service.service_id) {
    setEditedService(JSON.parse(JSON.stringify(service)));
  }

  if (!editedService) return null;

  const handleTimeChange = (
    system: "totem_plus" | "tam_tam" | "e_roster",
    direction: "outbound" | "return",
    station: string,
    value: string
  ) => {
    const updated = { ...editedService };
    const schedule = updated.systems_data[system].schedule;
    
    if (value.trim() === "") {
      // Remove the station time if empty
      delete (schedule[direction] as any)[station];
    } else {
      // Update or add the station time
      // Check if this time differs from régimé
      let isChanged = false;
      let isBorderCrossing = false;
      
      if (regimeService && editedService.date !== null) {
        const regimeSchedule = regimeService.systems_data.totem_plus.schedule;
        const regimeTime = (regimeSchedule[direction] as any)[station];
        
        if (regimeTime) {
          // Check if time differs from régimé
          isChanged = regimeTime.time !== value;
          // Preserve border_crossing flag from régimé
          isBorderCrossing = regimeTime.border_crossing || false;
        } else {
          // New station not in régimé - mark as changed
          isChanged = true;
        }
      }
      
      (schedule[direction] as any)[station] = { 
        time: value,
        changed: isChanged,
        border_crossing: isBorderCrossing
      };
    }
    
    setEditedService(updated);
  };

  const handleVisibilityToggle = (system: "tam_tam" | "e_roster") => {
    const updated = { ...editedService };
    updated.systems_data[system].visible = !updated.systems_data[system].visible;
    
    // Update status based on visibility
    if (!updated.systems_data[system].visible) {
      updated.systems_data[system].status = "Not_Visible";
    } else {
      updated.systems_data[system].status = system === "tam_tam" ? "Manually_Created" : "Automatically_Created";
    }
    
    setEditedService(updated);
  };

  const handleVerificationToggle = (field: "tam_tam_ok" | "e_roster_ok") => {
    const updated = { ...editedService };
    updated.verification[field] = !updated.verification[field];
    setEditedService(updated);
  };

  const handleSave = () => {
    if (editedService) {
      onUpdate(editedService);
      toast.success("Service updated successfully", {
        description: `Train ${editedService.train_info.train_number} has been updated.`,
      });
      onOpenChange(false);
    }
  };

  const handleSimulateDiscrepancy = (type: "schedule_mismatch" | "eroster_bug") => {
    const updated = { ...editedService };
    
    switch (type) {
      case "schedule_mismatch":
        // Change a Totem+ time but leave TamTam unchanged
        const totemSchedule = updated.systems_data.totem_plus.schedule;
        if (totemSchedule.return.bru_dep) {
          const currentTime = totemSchedule.return.bru_dep.time;
          const [hours, minutes] = currentTime.split(':');
          const newTime = `${String(Number(hours) + 1).padStart(2, '0')}:${minutes}`;
          totemSchedule.return.bru_dep = { time: newTime, changed: true };
          updated.verification.tam_tam_ok = false;
        } else if (totemSchedule.outbound.pno_dep) {
          const currentTime = totemSchedule.outbound.pno_dep.time;
          const [hours, minutes] = currentTime.split(':');
          const newTime = `${String(Number(hours) + 1).padStart(2, '0')}:${minutes}`;
          totemSchedule.outbound.pno_dep = { time: newTime, changed: true };
          updated.verification.tam_tam_ok = false;
        }
        toast.info("Schedule mismatch simulated", {
          description: "Totem+ schedule changed, TamTam not updated",
        });
        break;
        
      case "eroster_bug":
        // Simulate eRoster bug for short-term trains
        updated.systems_data.e_roster.visible = false;
        updated.systems_data.e_roster.status = "Not_Visible";
        updated.verification.e_roster_ok = false;
        toast.info("eRoster bug simulated", {
          description: "Train not visible in eRoster (short-term train bug)",
        });
        break;
        

    }
    
    setEditedService(updated);
  };

  const renderStationTimeInput = (
    system: "totem_plus" | "tam_tam" | "e_roster",
    direction: "outbound" | "return",
    station: string,
    label: string,
    stationTime?: StationTime
  ) => {
    return (
      <div className="flex items-center gap-2">
        <Label className="w-32 text-xs">{label}</Label>
        <Input
          value={stationTime?.time || ""}
          onChange={(e) => handleTimeChange(system, direction, station, e.target.value)}
          className="w-20 h-8 text-xs"
          placeholder="HH:MM"
        />
        {stationTime?.changed && (
          <Badge variant="outline" className="text-xs bg-yellow-400/20">Changed</Badge>
        )}
        {stationTime?.border_crossing && (
          <Badge variant="outline" className="text-xs text-red-400/70">Border</Badge>
        )}
      </div>
    );
  };

  const renderScheduleEditor = (system: "totem_plus" | "tam_tam" | "e_roster") => {
    const schedule = editedService.systems_data[system].schedule;
    
    return (
      <div className="space-y-4">
        <div>
          <h4 className="font-semibold mb-2">Outbound (PNO → AMS)</h4>
          <div className="space-y-2 pl-2">
            {renderStationTimeInput(system, "outbound", "pno_dep", "PNO dep", schedule.outbound.pno_dep)}
            {renderStationTimeInput(system, "outbound", "wnh_arr", "WNH arr", schedule.outbound.wnh_arr)}
            {renderStationTimeInput(system, "outbound", "bru_arr", "BRU arr", schedule.outbound.bru_arr)}
            {renderStationTimeInput(system, "outbound", "bru_dep", "BRU dep", schedule.outbound.bru_dep)}
            {renderStationTimeInput(system, "outbound", "hdk_arr", "HDK arr", schedule.outbound.hdk_arr)}
            {renderStationTimeInput(system, "outbound", "ams_arr", "AMS arr", schedule.outbound.ams_arr)}
          </div>
        </div>
        
        <div>
          <h4 className="font-semibold mb-2">Return (AMS → PNO)</h4>
          <div className="space-y-2 pl-2">
            {renderStationTimeInput(system, "return", "ams_dep", "AMS dep", schedule.return.ams_dep)}
            {renderStationTimeInput(system, "return", "hdk_arr", "HDK arr", schedule.return.hdk_arr)}
            {renderStationTimeInput(system, "return", "bru_arr", "BRU arr", schedule.return.bru_arr)}
            {renderStationTimeInput(system, "return", "bru_dep", "BRU dep", schedule.return.bru_dep)}
            {renderStationTimeInput(system, "return", "wnh_arr", "WNH arr", schedule.return.wnh_arr)}
            {renderStationTimeInput(system, "return", "pno_arr", "PNO arr", schedule.return.pno_arr)}
          </div>
        </div>
      </div>
    );
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent 
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{
          ...(position.x !== 0 || position.y !== 0 ? {
            left: '50%',
            top: '50%',
            transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
          } : {}),
          cursor: isDragging ? 'grabbing' : 'default',
        }}
        onMouseDown={handleMouseDown}
      >
        <VisuallyHidden>
          <DialogTitle>
            Train {editedService.train_info.train_number}
            {editedService.date && ` - ${new Date(editedService.date).toLocaleDateString('en-GB')}`}
          </DialogTitle>
        </VisuallyHidden>
        <div className="drag-handle flex items-center gap-2 cursor-grab active:cursor-grabbing pb-3 mb-2 border-b select-none">
          <GripHorizontal className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">
            <div className="font-semibold text-lg">
              Train {editedService.train_info.train_number}
              {editedService.date && ` - ${new Date(editedService.date).toLocaleDateString('en-GB')}`}
            </div>
            <div className="text-sm text-muted-foreground">
              View and modify service data to simulate discrepancies between systems
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="space-y-2">
            <Label>Simulate Discrepancies</Label>
            <div className="flex gap-2 flex-wrap">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSimulateDiscrepancy("schedule_mismatch")}
              >
                Schedule Mismatch
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleSimulateDiscrepancy("eroster_bug")}
              >
                eRoster Bug
              </Button>

            </div>
          </div>

          {/* System Data Tabs */}
          <Tabs defaultValue="totem" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="totem">Totem+</TabsTrigger>
              <TabsTrigger value="tamtam">TamTam</TabsTrigger>
              <TabsTrigger value="eroster">eRoster</TabsTrigger>
            </TabsList>

            <TabsContent value="totem" className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Status</Label>
                  <Badge>{editedService.systems_data.totem_plus.status}</Badge>
                </div>
                {renderScheduleEditor("totem_plus")}
              </div>
            </TabsContent>

            <TabsContent value="tamtam" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Visible in TamTam</Label>
                  <Switch
                    checked={editedService.systems_data.tam_tam.visible}
                    onCheckedChange={() => handleVisibilityToggle("tam_tam")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Status</Label>
                  <Badge>{editedService.systems_data.tam_tam.status}</Badge>
                </div>
                {renderScheduleEditor("tam_tam")}
              </div>
            </TabsContent>

            <TabsContent value="eroster" className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Visible in eRoster</Label>
                  <Switch
                    checked={editedService.systems_data.e_roster.visible}
                    onCheckedChange={() => handleVisibilityToggle("e_roster")}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Status</Label>
                  <Badge>{editedService.systems_data.e_roster.status}</Badge>
                </div>
                {renderScheduleEditor("e_roster")}
              </div>
            </TabsContent>
          </Tabs>

          {/* Verification Status */}
          <div className="space-y-3 border-t pt-4">
            <Label>Verification Status</Label>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm">TamTam OK</span>
                <Switch
                  checked={editedService.verification.tam_tam_ok}
                  onCheckedChange={() => handleVerificationToggle("tam_tam_ok")}
                />
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm">eRoster OK</span>
                <Switch
                  checked={editedService.verification.e_roster_ok}
                  onCheckedChange={() => handleVerificationToggle("e_roster_ok")}
                />
              </div>

            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave}>
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
