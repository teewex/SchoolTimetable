import { 
  classes, 
  subjects, 
  teachers, 
  rooms, 
  teacherSubjects, 
  classSubjects, 
  timePeriods, 
  timetableEntries, 
  scheduleSettings,
  constraints,
  type Class, 
  type Subject, 
  type Teacher, 
  type Room, 
  type TeacherSubject,
  type ClassSubject,
  type TimePeriod,
  type TimetableEntry,
  type ScheduleSettings,
  type Constraint,
  type InsertClass, 
  type InsertSubject, 
  type InsertTeacher, 
  type InsertRoom,
  type InsertTeacherSubject,
  type InsertClassSubject,
  type InsertTimePeriod,
  type InsertTimetableEntry,
  type InsertScheduleSettings,
  type InsertConstraint,
  users, 
  type User, 
  type InsertUser 
} from "@shared/schema";
import { db } from "./db";
import { eq, and, inArray } from "drizzle-orm";

export interface IStorage {
  // Users
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Classes
  getClasses(): Promise<Class[]>;
  getClass(id: number): Promise<Class | undefined>;
  createClass(classData: InsertClass): Promise<Class>;
  updateClass(id: number, classData: InsertClass): Promise<Class>;
  deleteClass(id: number): Promise<void>;

  // Subjects
  getSubjects(): Promise<Subject[]>;
  getSubject(id: number): Promise<Subject | undefined>;
  createSubject(subjectData: InsertSubject): Promise<Subject>;
  updateSubject(id: number, subjectData: InsertSubject): Promise<Subject>;
  deleteSubject(id: number): Promise<void>;

  // Teachers
  getTeachers(): Promise<Teacher[]>;
  getTeacher(id: number): Promise<Teacher | undefined>;
  createTeacher(teacherData: InsertTeacher): Promise<Teacher>;
  updateTeacher(id: number, teacherData: InsertTeacher): Promise<Teacher>;
  deleteTeacher(id: number): Promise<void>;

  // Rooms
  getRooms(): Promise<Room[]>;
  getRoom(id: number): Promise<Room | undefined>;
  createRoom(roomData: InsertRoom): Promise<Room>;
  updateRoom(id: number, roomData: InsertRoom): Promise<Room>;
  deleteRoom(id: number): Promise<void>;

  // Teacher-Subject assignments
  assignTeacherToSubject(assignment: InsertTeacherSubject): Promise<TeacherSubject>;
  getTeacherSubjects(teacherId?: number): Promise<TeacherSubject[]>;
  getSubjectTeachers(subjectId: number): Promise<TeacherSubject[]>;
  deleteTeacherSubject(id: number): Promise<void>;

  // Class-Subject assignments
  assignSubjectToClass(assignment: InsertClassSubject): Promise<ClassSubject>;
  getClassSubjects(classId: number): Promise<(ClassSubject & { subject: Subject })[]>;
  getAllClassSubjects(): Promise<ClassSubject[]>;
  deleteClassSubject(id: number): Promise<void>;

  // Time periods
  getTimePeriods(): Promise<TimePeriod[]>;
  createTimePeriod(timePeriodData: InsertTimePeriod): Promise<TimePeriod>;
  deleteTimePeriod(id: number): Promise<void>;

  // Timetable
  getTimetable(filters: { classId?: number; teacherId?: number; weekNumber?: number }): Promise<(TimetableEntry & {
    class: Class;
    subject: Subject;
    teacher: Teacher;
    room?: Room;
    timePeriod: TimePeriod;
  })[]>;
  createTimetableEntry(entryData: InsertTimetableEntry): Promise<TimetableEntry>;
  updateTimetableEntry(id: number, entryData: InsertTimetableEntry): Promise<TimetableEntry>;
  deleteTimetableEntry(id: number): Promise<void>;
  clearGeneratedTimetable(): Promise<void>;

  // Schedule settings
  getScheduleSettings(): Promise<ScheduleSettings | undefined>;
  updateScheduleSettings(settingsData: InsertScheduleSettings): Promise<ScheduleSettings>;
  updateScheduleGenerated(): Promise<void>;

  // Constraints
  getConstraints(): Promise<Constraint[]>;
  getConstraintsByScope(scope: string, targetId?: number): Promise<Constraint[]>;
  createConstraint(constraintData: InsertConstraint): Promise<Constraint>;
  updateConstraint(id: number, constraintData: InsertConstraint): Promise<Constraint>;
  deleteConstraint(id: number): Promise<void>;

  // Dashboard
  getDashboardStats(): Promise<{
    totalClasses: number;
    activeTeachers: number;
    totalSubjects: number;
    scheduleStatus: 'generated' | 'pending' | 'error';
    lastGenerated?: string;
    recentActivity: Array<{
      type: 'schedule' | 'teacher' | 'conflict' | 'export';
      message: string;
      timestamp: string;
    }>;
  }>;
}

export class DatabaseStorage implements IStorage {
  // Users
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  // Classes
  async getClasses(): Promise<Class[]> {
    return await db.select().from(classes);
  }

  async getClass(id: number): Promise<Class | undefined> {
    const [classObj] = await db.select().from(classes).where(eq(classes.id, id));
    return classObj || undefined;
  }

  async createClass(classData: InsertClass): Promise<Class> {
    const [newClass] = await db.insert(classes).values(classData).returning();
    return newClass;
  }

  async updateClass(id: number, classData: InsertClass): Promise<Class> {
    const [updatedClass] = await db
      .update(classes)
      .set(classData)
      .where(eq(classes.id, id))
      .returning();
    return updatedClass;
  }

  async deleteClass(id: number): Promise<void> {
    await db.delete(classes).where(eq(classes.id, id));
  }

  // Subjects
  async getSubjects(): Promise<Subject[]> {
    return await db.select().from(subjects);
  }

  async getSubject(id: number): Promise<Subject | undefined> {
    const [subject] = await db.select().from(subjects).where(eq(subjects.id, id));
    return subject || undefined;
  }

  async createSubject(subjectData: InsertSubject): Promise<Subject> {
    const [newSubject] = await db.insert(subjects).values(subjectData).returning();
    return newSubject;
  }

  async updateSubject(id: number, subjectData: InsertSubject): Promise<Subject> {
    const [updatedSubject] = await db
      .update(subjects)
      .set(subjectData)
      .where(eq(subjects.id, id))
      .returning();
    return updatedSubject;
  }

  async deleteSubject(id: number): Promise<void> {
    await db.delete(subjects).where(eq(subjects.id, id));
  }

  // Teachers
  async getTeachers(): Promise<Teacher[]> {
    return await db.select().from(teachers);
  }

  async getTeacher(id: number): Promise<Teacher | undefined> {
    const [teacher] = await db.select().from(teachers).where(eq(teachers.id, id));
    return teacher || undefined;
  }

  async createTeacher(teacherData: InsertTeacher): Promise<Teacher> {
    const [newTeacher] = await db.insert(teachers).values(teacherData).returning();
    return newTeacher;
  }

  async updateTeacher(id: number, teacherData: InsertTeacher): Promise<Teacher> {
    const [updatedTeacher] = await db
      .update(teachers)
      .set(teacherData)
      .where(eq(teachers.id, id))
      .returning();
    return updatedTeacher;
  }

  async deleteTeacher(id: number): Promise<void> {
    await db.delete(teachers).where(eq(teachers.id, id));
  }

  // Rooms
  async getRooms(): Promise<Room[]> {
    return await db.select().from(rooms);
  }

  async getRoom(id: number): Promise<Room | undefined> {
    const [room] = await db.select().from(rooms).where(eq(rooms.id, id));
    return room || undefined;
  }

  async createRoom(roomData: InsertRoom): Promise<Room> {
    const [newRoom] = await db.insert(rooms).values(roomData).returning();
    return newRoom;
  }

  async updateRoom(id: number, roomData: InsertRoom): Promise<Room> {
    const [updatedRoom] = await db
      .update(rooms)
      .set(roomData)
      .where(eq(rooms.id, id))
      .returning();
    return updatedRoom;
  }

  async deleteRoom(id: number): Promise<void> {
    await db.delete(rooms).where(eq(rooms.id, id));
  }

  // Teacher-Subject assignments
  async assignTeacherToSubject(assignment: InsertTeacherSubject): Promise<TeacherSubject> {
    const [newAssignment] = await db.insert(teacherSubjects).values(assignment).returning();
    return newAssignment;
  }

  async getTeacherSubjects(teacherId?: number): Promise<TeacherSubject[]> {
    if (teacherId) {
      return await db.select().from(teacherSubjects).where(eq(teacherSubjects.teacherId, teacherId));
    }
    return await db.select().from(teacherSubjects);
  }

  async getTeacherSubjectsForTeacher(teacherId: number): Promise<Subject[]> {
    const results = await db
      .select({ subject: subjects })
      .from(teacherSubjects)
      .innerJoin(subjects, eq(teacherSubjects.subjectId, subjects.id))
      .where(eq(teacherSubjects.teacherId, teacherId));

    return results.map(r => r.subject);
  }

  async getSubjectTeachers(subjectId: number): Promise<TeacherSubject[]> {
    return await db
      .select()
      .from(teacherSubjects)
      .where(eq(teacherSubjects.subjectId, subjectId));
  }

  async deleteTeacherSubject(id: number): Promise<void> {
    await db.delete(teacherSubjects).where(eq(teacherSubjects.id, id));
  }

  // Class-Subject assignments
  async assignSubjectToClass(assignment: InsertClassSubject): Promise<ClassSubject> {
    const [newAssignment] = await db.insert(classSubjects).values(assignment).returning();
    return newAssignment;
  }

  async getClassSubjects(classId: number): Promise<(ClassSubject & { subject: Subject })[]> {
    const results = await db
      .select()
      .from(classSubjects)
      .innerJoin(subjects, eq(classSubjects.subjectId, subjects.id))
      .where(eq(classSubjects.classId, classId));

    return results.map(r => ({ ...r.class_subjects, subject: r.subjects }));
  }

  async getAllClassSubjects(): Promise<ClassSubject[]> {
    return await db.select().from(classSubjects);
  }

  async deleteClassSubject(id: number): Promise<void> {
    await db.delete(classSubjects).where(eq(classSubjects.id, id));
  }

  // Time periods
  async getTimePeriods(): Promise<TimePeriod[]> {
    return await db.select().from(timePeriods);
  }

  async createTimePeriod(timePeriodData: InsertTimePeriod): Promise<TimePeriod> {
    const [newTimePeriod] = await db.insert(timePeriods).values(timePeriodData).returning();
    return newTimePeriod;
  }

  async deleteTimePeriod(id: number): Promise<void> {
    await db.delete(timePeriods).where(eq(timePeriods.id, id));
  }

  // Timetable
  async getTimetable(filters: { classId?: number; teacherId?: number; weekNumber?: number }): Promise<(TimetableEntry & {
    class: Class;
    subject: Subject;
    teacher: Teacher;
    room?: Room;
    timePeriod: TimePeriod;
  })[]> {
    const conditions = [];
    if (filters.classId) {
      conditions.push(eq(timetableEntries.classId, filters.classId));
    }
    if (filters.teacherId) {
      conditions.push(eq(timetableEntries.teacherId, filters.teacherId));
    }
    if (filters.weekNumber) {
      conditions.push(eq(timetableEntries.weekNumber, filters.weekNumber));
    }

    let query = db
      .select()
      .from(timetableEntries)
      .innerJoin(classes, eq(timetableEntries.classId, classes.id))
      .innerJoin(subjects, eq(timetableEntries.subjectId, subjects.id))
      .innerJoin(teachers, eq(timetableEntries.teacherId, teachers.id))
      .leftJoin(rooms, eq(timetableEntries.roomId, rooms.id))
      .innerJoin(timePeriods, eq(timetableEntries.timePeriodId, timePeriods.id));

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const results = await query;

    return results.map(r => ({
      ...r.timetable_entries,
      class: r.classes,
      subject: r.subjects,
      teacher: r.teachers,
      room: r.rooms || undefined,
      timePeriod: r.time_periods,
    }));
  }

  async createTimetableEntry(entryData: InsertTimetableEntry): Promise<TimetableEntry> {
    const [newEntry] = await db.insert(timetableEntries).values(entryData).returning();
    return newEntry;
  }

  async updateTimetableEntry(id: number, entryData: InsertTimetableEntry): Promise<TimetableEntry> {
    const [updatedEntry] = await db
      .update(timetableEntries)
      .set(entryData)
      .where(eq(timetableEntries.id, id))
      .returning();
    return updatedEntry;
  }

  async deleteTimetableEntry(id: number): Promise<void> {
    await db.delete(timetableEntries).where(eq(timetableEntries.id, id));
  }

  async clearGeneratedTimetable(): Promise<void> {
    await db.delete(timetableEntries).where(eq(timetableEntries.isGenerated, true));
  }

  // Schedule settings
  async getScheduleSettings(): Promise<ScheduleSettings | undefined> {
    const [settings] = await db.select().from(scheduleSettings).limit(1);
    return settings || undefined;
  }

  async getConstraints() {
    try {
      return await db.select().from(constraints);
    } catch (error) {
      console.error("Error fetching constraints:", error);
      return [];
    }
  }

  async updateScheduleSettings(settingsData: InsertScheduleSettings): Promise<ScheduleSettings> {
    const existing = await this.getScheduleSettings();

    if (existing) {
      const [updated] = await db
        .update(scheduleSettings)
        .set({ ...settingsData, updatedAt: new Date() })
        .where(eq(scheduleSettings.id, existing.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(scheduleSettings).values(settingsData).returning();
      return created;
    }
  }

  async updateScheduleGenerated(): Promise<void> {
    const existing = await this.getScheduleSettings();

    if (existing) {
      await db
        .update(scheduleSettings)
        .set({ lastGenerated: new Date(), updatedAt: new Date() })
        .where(eq(scheduleSettings.id, existing.id));
    }
  }

  // Dashboard
  async getDashboardStats(): Promise<{
    totalClasses: number;
    activeTeachers: number;
    totalSubjects: number;
    scheduleStatus: 'generated' | 'pending' | 'error';
    lastGenerated?: string;
    recentActivity: Array<{
      type: 'schedule' | 'teacher' | 'conflict' | 'export';
      message: string;
      timestamp: string;
    }>;
  }> {
    const [classCount] = await db.select().from(classes);
    const [teacherCount] = await db.select().from(teachers);
    const [subjectCount] = await db.select().from(subjects);
    const [timetableCount] = await db.select().from(timetableEntries);
    const settings = await this.getScheduleSettings();

    const totalClasses = (await db.select().from(classes)).length;
    const activeTeachers = (await db.select().from(teachers)).length;
    const totalSubjects = (await db.select().from(subjects)).length;
    const hasSchedule = (await db.select().from(timetableEntries).limit(1)).length > 0;

    return {
      totalClasses,
      activeTeachers,
      totalSubjects,
      scheduleStatus: hasSchedule ? 'generated' : 'pending',
      lastGenerated: settings?.lastGenerated ? new Date(settings.lastGenerated).toLocaleString() : undefined,
      recentActivity: [], // In a real implementation, this would track actual activity
    };
  }

  // Constraints
  async getConstraints(): Promise<Constraint[]> {
    return await db.select().from(constraints).where(eq(constraints.isActive, true));
  }

  async getConstraintsByScope(scope: string, targetId?: number): Promise<Constraint[]> {
    if (targetId) {
      return await db.select().from(constraints)
        .where(and(eq(constraints.isActive, true), eq(constraints.targetId, targetId)));
    }

    return await db.select().from(constraints).where(eq(constraints.isActive, true));
  }

  async createConstraint(constraintData: InsertConstraint): Promise<Constraint> {
    const insertData = {
      name: constraintData.name,
      description: constraintData.description || null,
      type: constraintData.type,
      scope: constraintData.scope,
      targetId: constraintData.targetId || null,
      rule: constraintData.rule || {},
      priority: constraintData.priority || 5,
      isActive: constraintData.isActive ?? true,
    };

    const [constraint] = await db.insert(constraints).values(insertData).returning();
    return constraint;
  }

  async updateConstraint(id: number, constraintData: InsertConstraint): Promise<Constraint> {
    const [constraint] = await db
      .update(constraints)
      .set({ ...constraintData, updatedAt: new Date() })
      .where(eq(constraints.id, id))
      .returning();
    return constraint;
  }

  async deleteConstraint(id: number): Promise<void> {
    await db.delete(constraints).where(eq(constraints.id, id));
  }
}

export const storage = new DatabaseStorage();