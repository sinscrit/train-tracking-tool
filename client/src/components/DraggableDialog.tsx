import { useState, useRef, useEffect, ReactNode } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { GripHorizontal } from "lucide-react";

interface DraggableDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: ReactNode;
  children: ReactNode;
}

export function DraggableDialog({
  open,
  onOpenChange,
  title,
  children,
}: DraggableDialogProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const dialogRef = useRef<HTMLDivElement>(null);

  // Reset position when dialog opens
  useEffect(() => {
    if (open) {
      setPosition({ x: 0, y: 0 });
    }
  }, [open]);

  const handleMouseDown = (e: React.MouseEvent) => {
    // Only start dragging if clicking on the drag handle area
    if ((e.target as HTMLElement).closest('.drag-handle')) {
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    }
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Constrain to viewport
      const maxX = window.innerWidth - 400; // Approximate dialog width
      const maxY = window.innerHeight - 200; // Approximate minimum height
      
      setPosition({
        x: Math.max(-200, Math.min(newX, maxX)),
        y: Math.max(-100, Math.min(newY, maxY)),
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDragging, dragStart, position]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        ref={dialogRef}
        className="max-w-4xl max-h-[90vh] overflow-y-auto"
        style={{
          transform: `translate(calc(-50% + ${position.x}px), calc(-50% + ${position.y}px))`,
          cursor: isDragging ? 'grabbing' : 'default',
        }}
        onMouseDown={handleMouseDown}
      >
        <div className="drag-handle flex items-center gap-2 cursor-grab active:cursor-grabbing pb-2 border-b">
          <GripHorizontal className="h-5 w-5 text-muted-foreground" />
          <div className="flex-1">{title}</div>
        </div>
        {children}
      </DialogContent>
    </Dialog>
  );
}
