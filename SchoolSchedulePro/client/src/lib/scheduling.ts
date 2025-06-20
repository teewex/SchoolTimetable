// Client-side scheduling utilities and helpers

export interface TimeSlot {
  start: string;
  end: string;
  day: string;
}

export interface SchedulingConstraint {
  type: 'teacher_availability' | 'room_capacity' | 'subject_requirements' | 'class_hours';
  severity: 'hard' | 'soft';
  description: string;
}

export interface ConflictDetectionResult {
  hasConflicts: boolean;
  conflicts: Array<{
    type: 'teacher' | 'room' | 'class';
    message: string;
    timeSlot: TimeSlot;
    entities: string[];
  }>;
}

// Time utilities
export const parseTime = (timeString: string): number => {
  const [hours, minutes] = timeString.split(':').map(Number);
  return hours * 60 + minutes;
};

export const formatTime = (minutes: number): string => {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
};

export const isTimeOverlap = (
  slot1: { start: string; end: string },
  slot2: { start: string; end: string }
): boolean => {
  const start1 = parseTime(slot1.start);
  const end1 = parseTime(slot1.end);
  const start2 = parseTime(slot2.start);
  const end2 = parseTime(slot2.end);

  return start1 < end2 && start2 < end1;
};

// Conflict detection utilities
export const detectTeacherConflicts = (
  entries: Array<{
    teacherId: number;
    timePeriod: { startTime: string; endTime: string; dayOfWeek: string };
  }>
): ConflictDetectionResult => {
  const conflicts: ConflictDetectionResult['conflicts'] = [];
  const teacherSchedules = new Map<number, Array<{ timeSlot: TimeSlot; entryId: string }>>();

  // Group entries by teacher
  entries.forEach((entry, index) => {
    const teacherId = entry.teacherId;
    const timeSlot: TimeSlot = {
      start: entry.timePeriod.startTime,
      end: entry.timePeriod.endTime,
      day: entry.timePeriod.dayOfWeek,
    };

    if (!teacherSchedules.has(teacherId)) {
      teacherSchedules.set(teacherId, []);
    }

    teacherSchedules.get(teacherId)!.push({
      timeSlot,
      entryId: `entry-${index}`,
    });
  });

  // Check for overlaps within each teacher's schedule
  teacherSchedules.forEach((schedule, teacherId) => {
    for (let i = 0; i < schedule.length; i++) {
      for (let j = i + 1; j < schedule.length; j++) {
        const slot1 = schedule[i];
        const slot2 = schedule[j];

        if (
          slot1.timeSlot.day === slot2.timeSlot.day &&
          isTimeOverlap(slot1.timeSlot, slot2.timeSlot)
        ) {
          conflicts.push({
            type: 'teacher',
            message: `Teacher ${teacherId} has overlapping classes`,
            timeSlot: slot1.timeSlot,
            entities: [slot1.entryId, slot2.entryId],
          });
        }
      }
    }
  });

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
};

export const detectRoomConflicts = (
  entries: Array<{
    roomId?: number;
    timePeriod: { startTime: string; endTime: string; dayOfWeek: string };
  }>
): ConflictDetectionResult => {
  const conflicts: ConflictDetectionResult['conflicts'] = [];
  const roomSchedules = new Map<number, Array<{ timeSlot: TimeSlot; entryId: string }>>();

  // Group entries by room (exclude entries without room assignment)
  entries.forEach((entry, index) => {
    if (!entry.roomId) return;

    const roomId = entry.roomId;
    const timeSlot: TimeSlot = {
      start: entry.timePeriod.startTime,
      end: entry.timePeriod.endTime,
      day: entry.timePeriod.dayOfWeek,
    };

    if (!roomSchedules.has(roomId)) {
      roomSchedules.set(roomId, []);
    }

    roomSchedules.get(roomId)!.push({
      timeSlot,
      entryId: `entry-${index}`,
    });
  });

  // Check for overlaps within each room's schedule
  roomSchedules.forEach((schedule, roomId) => {
    for (let i = 0; i < schedule.length; i++) {
      for (let j = i + 1; j < schedule.length; j++) {
        const slot1 = schedule[i];
        const slot2 = schedule[j];

        if (
          slot1.timeSlot.day === slot2.timeSlot.day &&
          isTimeOverlap(slot1.timeSlot, slot2.timeSlot)
        ) {
          conflicts.push({
            type: 'room',
            message: `Room ${roomId} has overlapping bookings`,
            timeSlot: slot1.timeSlot,
            entities: [slot1.entryId, slot2.entryId],
          });
        }
      }
    }
  });

  return {
    hasConflicts: conflicts.length > 0,
    conflicts,
  };
};

// Schedule validation
export const validateScheduleIntegrity = (entries: any[]): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
} => {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for required fields
  entries.forEach((entry, index) => {
    if (!entry.classId) errors.push(`Entry ${index}: Missing class assignment`);
    if (!entry.subjectId) errors.push(`Entry ${index}: Missing subject assignment`);
    if (!entry.teacherId) errors.push(`Entry ${index}: Missing teacher assignment`);
    if (!entry.timePeriodId) errors.push(`Entry ${index}: Missing time period assignment`);
  });

  // Check for conflicts
  const teacherConflicts = detectTeacherConflicts(entries);
  if (teacherConflicts.hasConflicts) {
    teacherConflicts.conflicts.forEach(conflict => {
      errors.push(conflict.message);
    });
  }

  const roomConflicts = detectRoomConflicts(entries);
  if (roomConflicts.hasConflicts) {
    roomConflicts.conflicts.forEach(conflict => {
      warnings.push(conflict.message);
    });
  }

  return {
    isValid: errors.length === 0,
    errors,
    warnings,
  };
};

// Schedule optimization utilities
export const calculateTeacherWorkload = (
  entries: Array<{ teacherId: number; timePeriod: { dayOfWeek: string } }>,
  teacherId: number
): {
  totalClasses: number;
  dailyDistribution: Record<string, number>;
  isBalanced: boolean;
} => {
  const teacherEntries = entries.filter(entry => entry.teacherId === teacherId);
  const dailyDistribution: Record<string, number> = {
    monday: 0,
    tuesday: 0,
    wednesday: 0,
    thursday: 0,
    friday: 0,
  };

  teacherEntries.forEach(entry => {
    const day = entry.timePeriod.dayOfWeek;
    dailyDistribution[day] = (dailyDistribution[day] || 0) + 1;
  });

  const dailyCounts = Object.values(dailyDistribution);
  const maxDaily = Math.max(...dailyCounts);
  const minDaily = Math.min(...dailyCounts);
  const isBalanced = maxDaily - minDaily <= 2; // Allow difference of 2 classes per day

  return {
    totalClasses: teacherEntries.length,
    dailyDistribution,
    isBalanced,
  };
};

export const suggestOptimizations = (entries: any[]): Array<{
  type: 'workload' | 'conflicts' | 'efficiency';
  priority: 'high' | 'medium' | 'low';
  description: string;
  suggestion: string;
}> => {
  const suggestions: Array<{
    type: 'workload' | 'conflicts' | 'efficiency';
    priority: 'high' | 'medium' | 'low';
    description: string;
    suggestion: string;
  }> = [];

  // Check teacher workload balance
  const teacherIds = Array.from(new Set(entries.map(entry => entry.teacherId)));
  teacherIds.forEach(teacherId => {
    const workload = calculateTeacherWorkload(entries, teacherId);
    if (!workload.isBalanced) {
      suggestions.push({
        type: 'workload',
        priority: 'medium',
        description: `Teacher ${teacherId} has unbalanced daily workload`,
        suggestion: 'Redistribute classes more evenly across the week',
      });
    }
  });

  // Check for conflicts
  const validation = validateScheduleIntegrity(entries);
  if (!validation.isValid) {
    suggestions.push({
      type: 'conflicts',
      priority: 'high',
      description: 'Schedule has conflicts that need resolution',
      suggestion: 'Review and resolve all scheduling conflicts before finalizing',
    });
  }

  return suggestions;
};

// Export utilities
export const generateScheduleSummary = (entries: any[]): {
  totalEntries: number;
  classCount: number;
  teacherCount: number;
  subjectCount: number;
  utilizationRate: number;
} => {
  const classes = new Set(entries.map(entry => entry.classId));
  const teachers = new Set(entries.map(entry => entry.teacherId));
  const subjects = new Set(entries.map(entry => entry.subjectId));
  
  // Calculate utilization rate (assuming 5 days × 8 periods × number of classes)
  const totalPossibleSlots = classes.size * 5 * 8;
  const utilizationRate = totalPossibleSlots > 0 ? (entries.length / totalPossibleSlots) * 100 : 0;

  return {
    totalEntries: entries.length,
    classCount: classes.size,
    teacherCount: teachers.size,
    subjectCount: subjects.size,
    utilizationRate: Math.round(utilizationRate * 100) / 100,
  };
};
