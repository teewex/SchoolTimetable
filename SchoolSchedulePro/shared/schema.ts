import { pgTable, text, serial, integer, boolean, timestamp, pgEnum, json } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Enums
export const dayOfWeekEnum = pgEnum('day_of_week', ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']);
export const roomTypeEnum = pgEnum('room_type', ['classroom', 'laboratory', 'auditorium', 'gym', 'library']);
export const constraintTypeEnum = pgEnum('constraint_type', ['hard', 'soft']);
export const constraintScopeEnum = pgEnum('constraint_scope', ['subject', 'teacher', 'class', 'room', 'global']);

// Tables
export const classes = pgTable("classes", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  level: text("level").notNull(), // e.g., "Grade 7", "JSS 1", "SSS 2"
  section: text("section").notNull(), // e.g., "A", "B", "C"
  maxStudents: integer("max_students").default(30),
  createdAt: timestamp("created_at").defaultNow(),
});

export const subjects = pgTable("subjects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  code: text("code").notNull().unique(),
  weeklyHours: integer("weekly_hours").notNull().default(3),
  requiresLab: boolean("requires_lab").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teachers = pgTable("teachers", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  phone: text("phone"),
  maxClassesPerDay: integer("max_classes_per_day").default(6),
  maxClassesPerWeek: integer("max_classes_per_week").default(30),
  availability: json("availability"), // JSON object storing day/time availability
  createdAt: timestamp("created_at").defaultNow(),
});

export const rooms = pgTable("rooms", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: roomTypeEnum("type").notNull(),
  capacity: integer("capacity").notNull(),
  isAvailable: boolean("is_available").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

export const teacherSubjects = pgTable("teacher_subjects", {
  id: serial("id").primaryKey(),
  teacherId: integer("teacher_id").notNull().references(() => teachers.id, { onDelete: 'cascade' }),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: 'cascade' }),
});

export const classSubjects = pgTable("class_subjects", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: 'cascade' }),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  teacherId: integer("teacher_id").references(() => teachers.id),
  preferredRoomId: integer("preferred_room_id").references(() => rooms.id),
});

export const timePeriods = pgTable("time_periods", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Period 1", "Period 2"
  startTime: text("start_time").notNull(), // e.g., "08:00"
  endTime: text("end_time").notNull(), // e.g., "09:00"
  dayOfWeek: dayOfWeekEnum("day_of_week").notNull(),
  isBreak: boolean("is_break").default(false),
  orderIndex: integer("order_index").notNull(),
});

export const timetableEntries = pgTable("timetable_entries", {
  id: serial("id").primaryKey(),
  classId: integer("class_id").notNull().references(() => classes.id, { onDelete: 'cascade' }),
  subjectId: integer("subject_id").notNull().references(() => subjects.id, { onDelete: 'cascade' }),
  teacherId: integer("teacher_id").notNull().references(() => teachers.id, { onDelete: 'cascade' }),
  roomId: integer("room_id").references(() => rooms.id),
  timePeriodId: integer("time_period_id").notNull().references(() => timePeriods.id, { onDelete: 'cascade' }),
  weekNumber: integer("week_number").default(1), // For recurring schedules
  isGenerated: boolean("is_generated").default(true), // false for manual entries
  createdAt: timestamp("created_at").defaultNow(),
});

export const scheduleSettings = pgTable("schedule_settings", {
  id: serial("id").primaryKey(),
  schoolName: text("school_name").default("School"),
  academicYear: text("academic_year").notNull(),
  termName: text("term_name").notNull(),
  workingDays: json("working_days").default(['monday', 'tuesday', 'wednesday', 'thursday', 'friday']),
  breakTimes: json("break_times").default([]),
  constraints: json("constraints").default({}),
  lastGenerated: timestamp("last_generated"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const constraints = pgTable("constraints", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: constraintTypeEnum("type").notNull(), // hard or soft
  scope: constraintScopeEnum("scope").notNull(), // subject, teacher, class, room, global
  targetId: integer("target_id"), // references the specific entity (subject_id, teacher_id, etc.)
  rule: json("rule").default({}), // JSON object containing constraint rules
  priority: integer("priority").notNull().default(5), // 1-10, higher = more important
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const classesRelations = relations(classes, ({ many }) => ({
  subjects: many(classSubjects),
  timetableEntries: many(timetableEntries),
}));

export const subjectsRelations = relations(subjects, ({ many }) => ({
  teachers: many(teacherSubjects),
  classes: many(classSubjects),
  timetableEntries: many(timetableEntries),
}));

export const teachersRelations = relations(teachers, ({ many }) => ({
  subjects: many(teacherSubjects),
  timetableEntries: many(timetableEntries),
}));

export const roomsRelations = relations(rooms, ({ many }) => ({
  timetableEntries: many(timetableEntries),
  classSubjects: many(classSubjects),
}));

export const teacherSubjectsRelations = relations(teacherSubjects, ({ one }) => ({
  teacher: one(teachers, {
    fields: [teacherSubjects.teacherId],
    references: [teachers.id],
  }),
  subject: one(subjects, {
    fields: [teacherSubjects.subjectId],
    references: [subjects.id],
  }),
}));

export const classSubjectsRelations = relations(classSubjects, ({ one }) => ({
  class: one(classes, {
    fields: [classSubjects.classId],
    references: [classes.id],
  }),
  subject: one(subjects, {
    fields: [classSubjects.subjectId],
    references: [subjects.id],
  }),
  teacher: one(teachers, {
    fields: [classSubjects.teacherId],
    references: [teachers.id],
  }),
  preferredRoom: one(rooms, {
    fields: [classSubjects.preferredRoomId],
    references: [rooms.id],
  }),
}));

export const timePeriodsRelations = relations(timePeriods, ({ many }) => ({
  timetableEntries: many(timetableEntries),
}));

export const timetableEntriesRelations = relations(timetableEntries, ({ one }) => ({
  class: one(classes, {
    fields: [timetableEntries.classId],
    references: [classes.id],
  }),
  subject: one(subjects, {
    fields: [timetableEntries.subjectId],
    references: [subjects.id],
  }),
  teacher: one(teachers, {
    fields: [timetableEntries.teacherId],
    references: [teachers.id],
  }),
  room: one(rooms, {
    fields: [timetableEntries.roomId],
    references: [rooms.id],
  }),
  timePeriod: one(timePeriods, {
    fields: [timetableEntries.timePeriodId],
    references: [timePeriods.id],
  }),
}));

// Insert schemas
export const insertClassSchema = createInsertSchema(classes).omit({
  id: true,
  createdAt: true,
});

export const insertSubjectSchema = createInsertSchema(subjects).omit({
  id: true,
  createdAt: true,
});

export const insertTeacherSchema = createInsertSchema(teachers).omit({
  id: true,
  createdAt: true,
});

export const insertRoomSchema = createInsertSchema(rooms).omit({
  id: true,
  createdAt: true,
});

export const insertTeacherSubjectSchema = createInsertSchema(teacherSubjects).omit({
  id: true,
});

export const insertClassSubjectSchema = createInsertSchema(classSubjects).omit({
  id: true,
});

export const insertTimePeriodSchema = createInsertSchema(timePeriods).omit({
  id: true,
});

export const insertTimetableEntrySchema = createInsertSchema(timetableEntries).omit({
  id: true,
  createdAt: true,
});

export const insertScheduleSettingsSchema = createInsertSchema(scheduleSettings).omit({
  id: true,
  lastGenerated: true,
  updatedAt: true,
});

export const insertConstraintSchema = createInsertSchema(constraints).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
}).extend({
  rule: z.object({}).optional(),
});

// Types
export type Class = typeof classes.$inferSelect;
export type InsertClass = z.infer<typeof insertClassSchema>;

export type Subject = typeof subjects.$inferSelect;
export type InsertSubject = z.infer<typeof insertSubjectSchema>;

export type Teacher = typeof teachers.$inferSelect;
export type InsertTeacher = z.infer<typeof insertTeacherSchema>;

export type Room = typeof rooms.$inferSelect;
export type InsertRoom = z.infer<typeof insertRoomSchema>;

export type TeacherSubject = typeof teacherSubjects.$inferSelect;
export type InsertTeacherSubject = z.infer<typeof insertTeacherSubjectSchema>;

export type ClassSubject = typeof classSubjects.$inferSelect;
export type InsertClassSubject = z.infer<typeof insertClassSubjectSchema>;

export type TimePeriod = typeof timePeriods.$inferSelect;
export type InsertTimePeriod = z.infer<typeof insertTimePeriodSchema>;

export type TimetableEntry = typeof timetableEntries.$inferSelect;
export type InsertTimetableEntry = z.infer<typeof insertTimetableEntrySchema>;

export type ScheduleSettings = typeof scheduleSettings.$inferSelect;
export type InsertScheduleSettings = z.infer<typeof insertScheduleSettingsSchema>;

export type Constraint = typeof constraints.$inferSelect;
export type InsertConstraint = z.infer<typeof insertConstraintSchema>;

// Legacy user schema (keeping for compatibility)
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
