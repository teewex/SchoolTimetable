import { storage } from "../storage";
import type { 
  Class, 
  Subject, 
  Teacher, 
  Room, 
  TimePeriod, 
  TimetableEntry,
  InsertTimetableEntry,
  ClassSubject,
  Constraint
} from "@shared/schema";

interface SchedulingOptions {
  optimizeTeacherWorkload: boolean;
  minimizeRoomChanges: boolean;
  prioritizeMorningClasses: boolean;
  enforceHardConstraints: boolean;
  respectSoftConstraints: boolean;
}

interface SchedulingResult {
  success: boolean;
  timetableEntries: InsertTimetableEntry[];
  stats: {
    totalClasses: number;
    totalEntries: number;
    conflictsResolved: number;
  };
  conflicts: string[];
  errors?: string[];
}

interface TeacherWorkload {
  teacherId: number;
  classesPerDay: { [day: string]: number };
  totalClasses: number;
}

interface ConflictCheck {
  teacherConflicts: boolean;
  roomConflicts: boolean;
  classConflicts: boolean;
}

class SchedulingEngine {
  private classes: Class[] = [];
  private subjects: Subject[] = [];
  private teachers: Teacher[] = [];
  private rooms: Room[] = [];
  private timePeriods: TimePeriod[] = [];
  private classSubjects: ClassSubject[] = [];
  private constraints: Constraint[] = [];
  private teacherWorkloads: Map<number, TeacherWorkload> = new Map();
  private generatedEntries: InsertTimetableEntry[] = [];

  async generateSchedule(options: SchedulingOptions): Promise<SchedulingResult> {
    try {
      // Load all necessary data
      await this.loadData();

      // Initialize workload tracking
      this.initializeWorkloadTracking();

      // Clear previous entries
      this.generatedEntries = [];

      // Check if there are any class-subject assignments
      if (this.classSubjects.length === 0) {
        return {
          success: false,
          timetableEntries: [],
          stats: { totalClasses: 0, totalEntries: 0, conflictsResolved: 0 },
          conflicts: [],
          errors: ['No class-subject assignments found. Please assign subjects to classes first.'],
        };
      }

      // Generate timetable entries for each class-subject combination
      const conflicts: string[] = [];
      let conflictsResolved = 0;

      for (const classSubject of this.classSubjects) {
        const subject = this.subjects.find(s => s.id === classSubject.subjectId);
        const classObj = this.classes.find(c => c.id === classSubject.classId);
        
        if (!subject || !classObj) continue;

        // Calculate how many periods this subject needs per week
        const periodsNeeded = subject.weeklyHours;

        // Find suitable time slots for this subject
        const suitableSlots = await this.findSuitableTimeSlots(
          classSubject,
          periodsNeeded,
          options
        );

        if (suitableSlots.length < periodsNeeded) {
          conflicts.push(
            `Cannot schedule all ${periodsNeeded} periods for ${subject.name} in ${classObj.name}`
          );
        }

        // Assign time slots
        for (let i = 0; i < Math.min(suitableSlots.length, periodsNeeded); i++) {
          const slot = suitableSlots[i];
          const entry: InsertTimetableEntry = {
            classId: classSubject.classId,
            subjectId: classSubject.subjectId,
            teacherId: classSubject.teacherId || slot.teacherId,
            roomId: classSubject.preferredRoomId || slot.roomId,
            timePeriodId: slot.timePeriodId,
            weekNumber: 1,
            isGenerated: true,
          };

          // Check for conflicts
          const conflictCheck = this.checkConflicts(entry);
          const constraintsValid = this.validateConstraints(entry, options);
          
          if (conflictCheck.teacherConflicts || conflictCheck.roomConflicts || conflictCheck.classConflicts || !constraintsValid) {
            // Try to resolve conflicts
            const resolved = await this.resolveConflicts(entry, slot);
            if (resolved && this.validateConstraints(resolved, options)) {
              this.generatedEntries.push(resolved);
              conflictsResolved++;
            } else {
              conflicts.push(
                `Unresolvable conflict for ${subject.name} in ${classObj.name} at ${slot.timePeriod.name}`
              );
            }
          } else {
            this.generatedEntries.push(entry);
          }

          // Update workload tracking
          if (entry.teacherId) {
            this.updateTeacherWorkload(entry.teacherId, slot.timePeriod.dayOfWeek);
          }
        }
      }

      return {
        success: true,
        timetableEntries: this.generatedEntries,
        stats: {
          totalClasses: this.classes.length,
          totalEntries: this.generatedEntries.length,
          conflictsResolved,
        },
        conflicts,
      };

    } catch (error) {
      return {
        success: false,
        timetableEntries: [],
        stats: { totalClasses: 0, totalEntries: 0, conflictsResolved: 0 },
        conflicts: [],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
      };
    }
  }

  private async loadData(): Promise<void> {
    [
      this.classes,
      this.subjects,
      this.teachers,
      this.rooms,
      this.timePeriods,
      this.classSubjects,
      this.constraints
    ] = await Promise.all([
      storage.getClasses(),
      storage.getSubjects(),
      storage.getTeachers(),
      storage.getRooms(),
      storage.getTimePeriods(),
      storage.getAllClassSubjects(),
      storage.getConstraints(),
    ]);
  }

  private initializeWorkloadTracking(): void {
    this.teacherWorkloads.clear();
    for (const teacher of this.teachers) {
      this.teacherWorkloads.set(teacher.id, {
        teacherId: teacher.id,
        classesPerDay: {
          monday: 0,
          tuesday: 0,
          wednesday: 0,
          thursday: 0,
          friday: 0,
        },
        totalClasses: 0,
      });
    }
  }

  private async findSuitableTimeSlots(
    classSubject: ClassSubject,
    periodsNeeded: number,
    options: SchedulingOptions
  ): Promise<Array<{
    timePeriodId: number;
    timePeriod: TimePeriod;
    teacherId: number;
    roomId?: number;
  }>> {
    const suitableSlots: Array<{
      timePeriodId: number;
      timePeriod: TimePeriod;
      teacherId: number;
      roomId?: number;
    }> = [];

    // Get available teachers for this subject
    const availableTeachers = await this.getAvailableTeachers(classSubject.subjectId);
    
    // Sort time periods by priority (morning first if specified)
    const sortedTimePeriods = [...this.timePeriods]
      .filter(tp => !tp.isBreak)
      .sort((a, b) => {
        if (options.prioritizeMorningClasses) {
          const aHour = parseInt(a.startTime.split(':')[0]);
          const bHour = parseInt(b.startTime.split(':')[0]);
          return aHour - bHour;
        }
        return a.orderIndex - b.orderIndex;
      });

    for (const timePeriod of sortedTimePeriods) {
      if (suitableSlots.length >= periodsNeeded) break;

      for (const teacher of availableTeachers) {
        // Check teacher availability
        if (!this.isTeacherAvailable(teacher, timePeriod)) continue;

        // Check workload constraints
        if (!this.checkTeacherWorkloadConstraints(teacher, timePeriod, options)) continue;

        // Find suitable room
        const suitableRoom = await this.findSuitableRoom(classSubject, timePeriod);

        suitableSlots.push({
          timePeriodId: timePeriod.id,
          timePeriod,
          teacherId: teacher.id,
          roomId: suitableRoom?.id,
        });
        break; // Use first available teacher for this slot
      }
    }

    return suitableSlots;
  }

  private async getAvailableTeachers(subjectId: number): Promise<Teacher[]> {
    const teacherSubjects = await storage.getSubjectTeachers(subjectId);
    return teacherSubjects.map(ts => this.teachers.find(t => t.id === ts.teacherId)).filter(Boolean) as Teacher[];
  }

  private isTeacherAvailable(teacher: Teacher, timePeriod: TimePeriod): boolean {
    if (!teacher.availability) return true;

    const availability = teacher.availability as any;
    const dayAvailability = availability[timePeriod.dayOfWeek];
    
    if (!dayAvailability) return false;

    const startHour = parseInt(timePeriod.startTime.split(':')[0]);
    const endHour = parseInt(timePeriod.endTime.split(':')[0]);

    return dayAvailability.some((slot: any) => {
      const slotStart = parseInt(slot.start.split(':')[0]);
      const slotEnd = parseInt(slot.end.split(':')[0]);
      return startHour >= slotStart && endHour <= slotEnd;
    });
  }

  private checkTeacherWorkloadConstraints(
    teacher: Teacher,
    timePeriod: TimePeriod,
    options: SchedulingOptions
  ): boolean {
    const workload = this.teacherWorkloads.get(teacher.id);
    if (!workload) return false;

    // Check daily limit
    const dayClasses = workload.classesPerDay[timePeriod.dayOfWeek];
    if (dayClasses >= (teacher.maxClassesPerDay || 6)) return false;

    // Check weekly limit
    if (workload.totalClasses >= (teacher.maxClassesPerWeek || 30)) return false;

    return true;
  }

  private async findSuitableRoom(
    classSubject: ClassSubject,
    timePeriod: TimePeriod
  ): Promise<Room | undefined> {
    // If preferred room is specified, try to use it
    if (classSubject.preferredRoomId) {
      const preferredRoom = this.rooms.find(r => r.id === classSubject.preferredRoomId);
      if (preferredRoom && this.isRoomAvailable(preferredRoom, timePeriod)) {
        return preferredRoom;
      }
    }

    // Find any available room
    return this.rooms.find(room => 
      room.isAvailable && this.isRoomAvailable(room, timePeriod)
    );
  }

  private isRoomAvailable(room: Room, timePeriod: TimePeriod): boolean {
    // Check if room is already booked for this time period
    return !this.generatedEntries.some(entry => 
      entry.roomId === room.id && entry.timePeriodId === timePeriod.id
    );
  }

  private checkConflicts(entry: InsertTimetableEntry): ConflictCheck {
    const teacherConflicts = this.generatedEntries.some(existing => 
      existing.teacherId === entry.teacherId && 
      existing.timePeriodId === entry.timePeriodId
    );

    const roomConflicts = entry.roomId ? this.generatedEntries.some(existing => 
      existing.roomId === entry.roomId && 
      existing.timePeriodId === entry.timePeriodId
    ) : false;

    const classConflicts = this.generatedEntries.some(existing => 
      existing.classId === entry.classId && 
      existing.timePeriodId === entry.timePeriodId
    );

    return { teacherConflicts, roomConflicts, classConflicts };
  }

  private async resolveConflicts(
    entry: InsertTimetableEntry,
    originalSlot: any
  ): Promise<InsertTimetableEntry | null> {
    // Try to find alternative teacher
    if (entry.teacherId) {
      const alternativeTeachers = await this.getAvailableTeachers(entry.subjectId);
      for (const teacher of alternativeTeachers) {
        if (teacher.id === entry.teacherId) continue;
        
        const timePeriod = this.timePeriods.find(tp => tp.id === entry.timePeriodId);
        if (!timePeriod || !this.isTeacherAvailable(teacher, timePeriod)) continue;

        const testEntry = { ...entry, teacherId: teacher.id };
        const conflicts = this.checkConflicts(testEntry);
        
        if (!conflicts.teacherConflicts && !conflicts.classConflicts) {
          return testEntry;
        }
      }
    }

    // Try to find alternative room
    if (entry.roomId) {
      for (const room of this.rooms) {
        if (room.id === entry.roomId || !room.isAvailable) continue;
        
        const timePeriod = this.timePeriods.find(tp => tp.id === entry.timePeriodId);
        if (!timePeriod || !this.isRoomAvailable(room, timePeriod)) continue;

        const testEntry = { ...entry, roomId: room.id };
        const conflicts = this.checkConflicts(testEntry);
        
        if (!conflicts.roomConflicts) {
          return testEntry;
        }
      }
    }

    return null;
  }

  private updateTeacherWorkload(teacherId: number, dayOfWeek: string): void {
    const workload = this.teacherWorkloads.get(teacherId);
    if (workload) {
      workload.classesPerDay[dayOfWeek]++;
      workload.totalClasses++;
    }
  }

  private validateConstraints(entry: InsertTimetableEntry, options: SchedulingOptions): boolean {
    if (!options.enforceHardConstraints && !options.respectSoftConstraints) {
      return true;
    }

    for (const constraint of this.constraints) {
      if (!constraint.isActive) continue;

      // Skip soft constraints if not respecting them
      if (constraint.type === 'soft' && !options.respectSoftConstraints) continue;

      // Apply constraint validation based on scope
      const isValid = this.applyConstraint(constraint, entry);
      
      // Hard constraints must be satisfied
      if (constraint.type === 'hard' && !isValid) {
        return false;
      }
    }

    return true;
  }

  private applyConstraint(constraint: Constraint, entry: InsertTimetableEntry): boolean {
    // Basic constraint validation - can be extended based on specific constraint rules
    switch (constraint.scope) {
      case 'teacher':
        if (constraint.targetId && constraint.targetId !== entry.teacherId) {
          return true; // Constraint doesn't apply to this teacher
        }
        break;
      case 'class':
        if (constraint.targetId && constraint.targetId !== entry.classId) {
          return true; // Constraint doesn't apply to this class
        }
        break;
      case 'subject':
        if (constraint.targetId && constraint.targetId !== entry.subjectId) {
          return true; // Constraint doesn't apply to this subject
        }
        break;
      case 'room':
        if (constraint.targetId && constraint.targetId !== entry.roomId) {
          return true; // Constraint doesn't apply to this room
        }
        break;
    }

    // For now, return true for all constraints
    // This can be extended to implement specific constraint logic
    return true;
  }
}

export const schedulingEngine = new SchedulingEngine();
