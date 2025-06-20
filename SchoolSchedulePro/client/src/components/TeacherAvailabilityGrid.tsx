import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Clock, RotateCcw } from "lucide-react";

interface AvailabilitySlot {
  start: string;
  end: string;
  available: boolean;
}

interface DayAvailability {
  [key: string]: AvailabilitySlot[];
}

interface TeacherAvailabilityGridProps {
  availability: DayAvailability | null;
  onChange: (availability: DayAvailability) => void;
}

const DAYS = [
  { key: "monday", label: "Mon" },
  { key: "tuesday", label: "Tue" },
  { key: "wednesday", label: "Wed" },
  { key: "thursday", label: "Thu" },
  { key: "friday", label: "Fri" },
];

const TIME_SLOTS = [
  { start: "08:00", end: "09:00", label: "8:00-9:00" },
  { start: "09:00", end: "10:00", label: "9:00-10:00" },
  { start: "10:00", end: "11:00", label: "10:00-11:00" },
  { start: "11:00", end: "12:00", label: "11:00-12:00" },
  { start: "12:00", end: "13:00", label: "12:00-13:00" },
  { start: "13:00", end: "14:00", label: "13:00-14:00" },
  { start: "14:00", end: "15:00", label: "14:00-15:00" },
  { start: "15:00", end: "16:00", label: "15:00-16:00" },
];

const createDefaultAvailability = (): DayAvailability => {
  const defaultAvailability: DayAvailability = {};
  
  DAYS.forEach(day => {
    defaultAvailability[day.key] = TIME_SLOTS.map(slot => ({
      start: slot.start,
      end: slot.end,
      available: true, // Default to available
    }));
  });
  
  return defaultAvailability;
};

export default function TeacherAvailabilityGrid({
  availability,
  onChange,
}: TeacherAvailabilityGridProps) {
  const [localAvailability, setLocalAvailability] = useState<DayAvailability>(
    availability || createDefaultAvailability()
  );

  useEffect(() => {
    setLocalAvailability(availability || createDefaultAvailability());
  }, [availability]);

  const handleSlotToggle = (dayKey: string, timeSlotIndex: number) => {
    const updated = { ...localAvailability };
    if (updated[dayKey] && updated[dayKey][timeSlotIndex]) {
      updated[dayKey][timeSlotIndex].available = !updated[dayKey][timeSlotIndex].available;
      setLocalAvailability(updated);
      onChange(updated);
    }
  };

  const handleDayToggle = (dayKey: string, available: boolean) => {
    const updated = { ...localAvailability };
    if (updated[dayKey]) {
      updated[dayKey].forEach(slot => {
        slot.available = available;
      });
      setLocalAvailability(updated);
      onChange(updated);
    }
  };

  const handleAllToggle = (available: boolean) => {
    const updated = { ...localAvailability };
    Object.keys(updated).forEach(dayKey => {
      updated[dayKey].forEach(slot => {
        slot.available = available;
      });
    });
    setLocalAvailability(updated);
    onChange(updated);
  };

  const resetToDefault = () => {
    const defaultAvailability = createDefaultAvailability();
    setLocalAvailability(defaultAvailability);
    onChange(defaultAvailability);
  };

  const getAvailableCount = (dayKey: string): number => {
    return localAvailability[dayKey]?.filter(slot => slot.available).length || 0;
  };

  const getTotalAvailableCount = (): number => {
    return Object.keys(localAvailability).reduce((total, dayKey) => {
      return total + getAvailableCount(dayKey);
    }, 0);
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Clock className="w-5 h-5" />
            <span>Weekly Availability</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={resetToDefault}
            >
              <RotateCcw className="w-4 h-4 mr-1" />
              Reset
            </Button>
          </div>
        </div>
        <p className="text-sm text-gray-600">
          Select time slots when this teacher is available. 
          Total available: {getTotalAvailableCount()}/{TIME_SLOTS.length * DAYS.length} slots
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 pb-4 border-b">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAllToggle(true)}
            >
              Select All
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => handleAllToggle(false)}
            >
              Clear All
            </Button>
          </div>

          {/* Grid */}
          <div className="overflow-x-auto">
            <div className="inline-block min-w-full">
              <div className="grid grid-cols-6 gap-2 text-sm">
                {/* Header Row */}
                <div className="p-2 text-center font-medium text-gray-600">Time</div>
                {DAYS.map((day) => (
                  <div key={day.key} className="p-2 text-center">
                    <div className="font-medium text-gray-600 mb-1">{day.label}</div>
                    <div className="flex items-center justify-center space-x-1">
                      <Checkbox
                        checked={getAvailableCount(day.key) === TIME_SLOTS.length}
                        onCheckedChange={(checked) => handleDayToggle(day.key, !!checked)}
                      />
                      <span className="text-xs text-gray-500">
                        {getAvailableCount(day.key)}/{TIME_SLOTS.length}
                      </span>
                    </div>
                  </div>
                ))}

                {/* Time Slot Rows */}
                {TIME_SLOTS.map((timeSlot, timeIndex) => (
                  <div key={timeSlot.start} className="contents">
                    <div className="p-2 text-center text-gray-600 bg-secondary-50 rounded border">
                      <div className="text-xs font-medium">{timeSlot.label}</div>
                    </div>
                    {DAYS.map((day) => {
                      const slot = localAvailability[day.key]?.[timeIndex];
                      const isAvailable = slot?.available || false;
                      
                      return (
                        <div key={`${day.key}-${timeIndex}`} className="p-1">
                          <div
                            className={`
                              w-full h-10 border-2 rounded cursor-pointer transition-colors
                              flex items-center justify-center
                              ${isAvailable
                                ? "bg-green-100 border-green-300 hover:bg-green-200"
                                : "bg-red-100 border-red-300 hover:bg-red-200"
                              }
                            `}
                            onClick={() => handleSlotToggle(day.key, timeIndex)}
                          >
                            <Checkbox
                              checked={isAvailable}
                              onCheckedChange={() => handleSlotToggle(day.key, timeIndex)}
                              className="pointer-events-none"
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center space-x-6 pt-4 border-t text-sm">
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-green-100 border-2 border-green-300 rounded"></div>
              <span className="text-gray-600">Available</span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-4 h-4 bg-red-100 border-2 border-red-300 rounded"></div>
              <span className="text-gray-600">Unavailable</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
