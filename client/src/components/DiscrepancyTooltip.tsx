import { TrainService } from "@/data/trainData";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ReactNode } from "react";

interface DiscrepancyTooltipProps {
  service: TrainService;
  field: "tam_tam" | "e_roster";
  children: ReactNode;
}

export function DiscrepancyTooltip({ service, field, children }: DiscrepancyTooltipProps) {
  const getDiscrepancyDetails = () => {
    const totemSchedule = service.systems_data.totem_plus.schedule;
    
    switch (field) {
      case "tam_tam":
        if (!service.systems_data.tam_tam.visible) {
          return {
            title: "TamTam: Not Visible",
            details: "Blue trains are not automatically visible in TamTam system"
          };
        }
        const tamtamSchedule = service.systems_data.tam_tam.schedule;
        if (JSON.stringify(totemSchedule) !== JSON.stringify(tamtamSchedule)) {
          return {
            title: "Schedule Mismatch",
            details: `Totem+ and TamTam schedules differ. Manual verification required.`
          };
        }
        return {
          title: "TamTam Issue",
          details: "Manual verification required"
        };
        
      case "e_roster":
        if (!service.systems_data.e_roster.visible) {
          return {
            title: "eRoster: Not Visible",
            details: "Short-term train not appearing in eRoster (known bug)"
          };
        }
        const erosterSchedule = service.systems_data.e_roster.schedule;
        if (JSON.stringify(totemSchedule) !== JSON.stringify(erosterSchedule)) {
          return {
            title: "Schedule Mismatch",
            details: `Totem+ and eRoster schedules differ. Manual verification required.`
          };
        }
        return {
          title: "eRoster Issue",
          details: "Manual verification required"
        };
        

      default:
        return { title: "Issue Detected", details: "Unknown discrepancy" };
    }
  };

  const isOk = field === "tam_tam" 
    ? service.verification.tam_tam_ok 
    : field === "e_roster" 
    ? service.verification.e_roster_ok 
    : service.verification.tam_tam_ok;

  const isVisible = field === "tam_tam" 
    ? service.systems_data.tam_tam.visible 
    : field === "e_roster" 
    ? service.systems_data.e_roster.visible 
    : true;

  // Only show tooltip if there's an issue
  if (isOk && isVisible) {
    return <>{children}</>;
  }

  const details = getDiscrepancyDetails();

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        {children}
      </TooltipTrigger>
      <TooltipContent className="max-w-sm">
        <div className="space-y-1">
          <p className="font-semibold">{details.title}</p>
          <p className="text-sm whitespace-pre-line">{details.details}</p>
        </div>
      </TooltipContent>
    </Tooltip>
  );
}
