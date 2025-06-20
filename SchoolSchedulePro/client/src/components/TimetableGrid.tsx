import { useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Edit, MapPin, User } from "lucide-react";

interface TimetableEntry {
  id: number;
  class: { id: number; name: string; level: string; section: string };
  subject: { id: number; name: string; code: string };
  teacher: { id: number; name: string };
  room?: { id: number; name: string };
  timePeriod: {
    id: number;
    name: string;
    startTime: string;
    endTime: string;
    dayOfWeek: string;
    orderIndex: number;
  };
}

interface TimetableGridProps {
  data: TimetableEntry[];
  viewMode: "class" | "teacher" | "overview";
  selectedClassId?: number;
  selectedTeacherId?: number;
  onEditEntry?: (entry: TimetableEntry) => void;
}

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday"];
const DAY_LABELS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"];

const SUBJECT_COLORS: Record<string, string> = {
  math: "bg-blue-100 text-blue-800 border-blue-200",
  english: "bg-green-100 text-green-800 border-green-200",
  science: "bg-purple-100 text-purple-800 border-purple-200",
  history: "bg-yellow-100 text-yellow-800 border-yellow-200",
  pe: "bg-red-100 text-red-800 border-red-200",
  art: "bg-orange-100 text-orange-800 border-orange-200",
  music: "bg-pink-100 text-pink-800 border-pink-200",
  default: "bg-gray-100 text-gray-800 border-gray-200",
};

export default function TimetableGrid({
  data,
  viewMode,
  selectedClassId,
  selectedTeacherId,
  onEditEntry,
}: TimetableGridProps) {
  const { timeSlots, timetableGrid } = useMemo(() => {
    // Extract unique time slots and sort by order
    const slots = Array.from(
      new Set(data.map(entry => 
        `${entry.timePeriod.startTime}-${entry.timePeriod.endTime}|${entry.timePeriod.orderIndex}`
      ))
    )
      .map(slot => {
        const [timeRange, orderIndex] = slot.split('|');
        return { timeRange, orderIndex: parseInt(orderIndex) };
      })
      .sort((a, b) => a.orderIndex - b.orderIndex)
      .map(slot => slot.timeRange);

    // Create grid structure
    const grid: Record<string, Record<string, TimetableEntry[]>> = {};
    
    slots.forEach(timeSlot => {
      grid[timeSlot] = {};
      DAYS.forEach(day => {
        grid[timeSlot][day] = [];
      });
    });

    // Fill grid with entries
    data.forEach(entry => {
      const timeKey = `${entry.timePeriod.startTime}-${entry.timePeriod.endTime}`;
      const dayKey = entry.timePeriod.dayOfWeek;
      
      if (grid[timeKey] && grid[timeKey][dayKey]) {
        grid[timeKey][dayKey].push(entry);
      }
    });

    return { timeSlots: slots, timetableGrid: grid };
  }, [data]);

  const getSubjectColor = (subjectName: string): string => {
    const normalized = subjectName.toLowerCase();
    if (normalized.includes("math")) return SUBJECT_COLORS.math;
    if (normalized.includes("english")) return SUBJECT_COLORS.english;
    if (normalized.includes("science") || normalized.includes("biology") || normalized.includes("chemistry") || normalized.includes("physics")) return SUBJECT_COLORS.science;
    if (normalized.includes("history") || normalized.includes("social")) return SUBJECT_COLORS.history;
    if (normalized.includes("pe") || normalized.includes("physical") || normalized.includes("sport")) return SUBJECT_COLORS.pe;
    if (normalized.includes("art") || normalized.includes("drawing")) return SUBJECT_COLORS.art;
    if (normalized.includes("music")) return SUBJECT_COLORS.music;
    return SUBJECT_COLORS.default;
  };

  const renderCell = (entries: TimetableEntry[], timeSlot: string, day: string) => {
    if (entries.length === 0) {
      return (
        <div className="timetable-cell empty min-h-[80px] flex items-center justify-center text-gray-400">
          <span className="text-xs">Free</span>
        </div>
      );
    }

    if (entries.length === 1) {
      const entry = entries[0];
      const colorClass = getSubjectColor(entry.subject.name);
      
      return (
        <div className={`timetable-cell occupied min-h-[80px] p-3 ${colorClass} rounded-md border relative group`}>
          <div className="space-y-1">
            <div className="font-semibold text-sm">{entry.subject.name}</div>
            {viewMode !== "teacher" && (
              <div className="flex items-center text-xs">
                <User className="w-3 h-3 mr-1" />
                <span>{entry.teacher.name}</span>
              </div>
            )}
            {viewMode !== "class" && (
              <div className="text-xs font-medium">
                {entry.class.name} - {entry.class.level} {entry.class.section}
              </div>
            )}
            {entry.room && (
              <div className="flex items-center text-xs">
                <MapPin className="w-3 h-3 mr-1" />
                <span>{entry.room.name}</span>
              </div>
            )}
          </div>
          
          {onEditEntry && (
            <Button
              variant="ghost"
              size="sm"
              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 p-0"
              onClick={() => onEditEntry(entry)}
            >
              <Edit className="w-3 h-3" />
            </Button>
          )}
        </div>
      );
    }

    // Multiple entries (conflict)
    return (
      <div className="timetable-cell conflict min-h-[80px] p-2 bg-red-50 border-red-200 rounded-md">
        <div className="text-xs text-red-600 font-medium mb-1">Conflict!</div>
        <div className="space-y-1">
          {entries.map((entry, index) => (
            <div key={entry.id} className="text-xs bg-white p-1 rounded border">
              <div className="font-medium">{entry.subject.name}</div>
              <div>{entry.teacher.name}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  if (timeSlots.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No time slots configured. Please generate a schedule first.</p>
      </div>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-secondary-100">
              <th className="text-left p-4 font-semibold text-secondary-900 min-w-[120px] border-r border-secondary-200">
                Time
              </th>
              {DAY_LABELS.map((day) => (
                <th key={day} className="text-left p-4 font-semibold text-secondary-900 min-w-[200px] border-r border-secondary-200 last:border-r-0">
                  {day}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((timeSlot, timeIndex) => (
              <tr key={timeSlot} className="border-b border-secondary-200 hover:bg-secondary-50">
                <td className="p-4 font-medium text-secondary-700 border-r border-secondary-200 bg-secondary-50">
                  <div className="text-center">
                    <div className="font-semibold">Period {timeIndex + 1}</div>
                    <div className="text-sm text-gray-600">{timeSlot}</div>
                  </div>
                </td>
                {DAYS.map((day) => (
                  <td key={day} className="p-2 border-r border-secondary-200 last:border-r-0 align-top">
                    {renderCell(timetableGrid[timeSlot][day], timeSlot, day)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
