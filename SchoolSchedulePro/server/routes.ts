import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertClassSchema, 
  insertSubjectSchema, 
  insertTeacherSchema, 
  insertRoomSchema,
  insertTeacherSubjectSchema,
  insertClassSubjectSchema,
  insertTimePeriodSchema,
  insertTimetableEntrySchema,
  insertScheduleSettingsSchema
} from "@shared/schema";
import { schedulingEngine } from "./services/schedulingEngine";
import { generatePDF } from "./services/pdfExport";
import { generateExcel } from "./services/excelExport";

export async function registerRoutes(app: Express): Promise<Server> {
  // Classes routes
  app.get("/api/classes", async (req, res) => {
    try {
      const classes = await storage.getClasses();
      res.json(classes);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch classes" });
    }
  });

  app.post("/api/classes", async (req, res) => {
    try {
      const classData = insertClassSchema.parse(req.body);
      const newClass = await storage.createClass(classData);
      res.json(newClass);
    } catch (error) {
      res.status(400).json({ message: "Invalid class data" });
    }
  });

  app.put("/api/classes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const classData = insertClassSchema.parse(req.body);
      const updatedClass = await storage.updateClass(id, classData);
      res.json(updatedClass);
    } catch (error) {
      res.status(400).json({ message: "Failed to update class" });
    }
  });

  app.delete("/api/classes/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteClass(id);
      res.json({ message: "Class deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete class" });
    }
  });

  // Subjects routes
  app.get("/api/subjects", async (req, res) => {
    try {
      const subjects = await storage.getSubjects();
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  app.post("/api/subjects", async (req, res) => {
    try {
      const subjectData = insertSubjectSchema.parse(req.body);
      const newSubject = await storage.createSubject(subjectData);
      res.json(newSubject);
    } catch (error) {
      res.status(400).json({ message: "Invalid subject data" });
    }
  });

  app.put("/api/subjects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const subjectData = insertSubjectSchema.parse(req.body);
      const updatedSubject = await storage.updateSubject(id, subjectData);
      res.json(updatedSubject);
    } catch (error) {
      res.status(400).json({ message: "Failed to update subject" });
    }
  });

  app.delete("/api/subjects/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteSubject(id);
      res.json({ message: "Subject deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete subject" });
    }
  });

  // Teachers routes
  app.get("/api/teachers", async (req, res) => {
    try {
      const teachers = await storage.getTeachers();
      res.json(teachers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teachers" });
    }
  });

  app.get("/api/teachers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const teacher = await storage.getTeacher(id);
      if (!teacher) {
        return res.status(404).json({ message: "Teacher not found" });
      }
      res.json(teacher);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teacher" });
    }
  });

  app.post("/api/teachers", async (req, res) => {
    try {
      const teacherData = insertTeacherSchema.parse(req.body);
      const newTeacher = await storage.createTeacher(teacherData);
      res.json(newTeacher);
    } catch (error) {
      res.status(400).json({ message: "Invalid teacher data" });
    }
  });

  app.put("/api/teachers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const teacherData = insertTeacherSchema.parse(req.body);
      const updatedTeacher = await storage.updateTeacher(id, teacherData);
      res.json(updatedTeacher);
    } catch (error) {
      res.status(400).json({ message: "Failed to update teacher" });
    }
  });

  app.delete("/api/teachers/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTeacher(id);
      res.json({ message: "Teacher deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete teacher" });
    }
  });

  // Teacher-Subject assignments
  app.post("/api/teacher-subjects", async (req, res) => {
    try {
      const assignmentData = insertTeacherSubjectSchema.parse(req.body);
      const assignment = await storage.assignTeacherToSubject(assignmentData);
      res.json(assignment);
    } catch (error) {
      res.status(400).json({ message: "Failed to assign teacher to subject" });
    }
  });

  app.get("/api/teachers/:id/subjects", async (req, res) => {
    try {
      const teacherId = parseInt(req.params.id);
      const subjects = await storage.getTeacherSubjects(teacherId);
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teacher subjects" });
    }
  });

  // Rooms routes
  app.get("/api/rooms", async (req, res) => {
    try {
      const rooms = await storage.getRooms();
      res.json(rooms);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch rooms" });
    }
  });

  app.post("/api/rooms", async (req, res) => {
    try {
      const roomData = insertRoomSchema.parse(req.body);
      const newRoom = await storage.createRoom(roomData);
      res.json(newRoom);
    } catch (error) {
      res.status(400).json({ message: "Invalid room data" });
    }
  });

  app.put("/api/rooms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const roomData = insertRoomSchema.parse(req.body);
      const updatedRoom = await storage.updateRoom(id, roomData);
      res.json(updatedRoom);
    } catch (error) {
      res.status(400).json({ message: "Failed to update room" });
    }
  });

  app.delete("/api/rooms/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteRoom(id);
      res.json({ message: "Room deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete room" });
    }
  });

  // Class-Subject assignments
  app.post("/api/class-subjects", async (req, res) => {
    try {
      const assignmentData = insertClassSubjectSchema.parse(req.body);
      const assignment = await storage.assignSubjectToClass(assignmentData);
      res.json(assignment);
    } catch (error) {
      res.status(400).json({ message: "Failed to assign subject to class" });
    }
  });

  app.get("/api/classes/:id/subjects", async (req, res) => {
    try {
      const classId = parseInt(req.params.id);
      const subjects = await storage.getClassSubjects(classId);
      res.json(subjects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch class subjects" });
    }
  });

  // Time periods routes
  app.get("/api/time-periods", async (req, res) => {
    try {
      const timePeriods = await storage.getTimePeriods();
      res.json(timePeriods);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time periods" });
    }
  });

  app.post("/api/time-periods", async (req, res) => {
    try {
      const timePeriodData = insertTimePeriodSchema.parse(req.body);
      const newTimePeriod = await storage.createTimePeriod(timePeriodData);
      res.json(newTimePeriod);
    } catch (error) {
      res.status(400).json({ message: "Invalid time period data" });
    }
  });

  // Timetable routes
  app.get("/api/timetable", async (req, res) => {
    try {
      const { classId, teacherId, weekNumber } = req.query;
      const timetable = await storage.getTimetable({
        classId: classId ? parseInt(classId as string) : undefined,
        teacherId: teacherId ? parseInt(teacherId as string) : undefined,
        weekNumber: weekNumber ? parseInt(weekNumber as string) : 1,
      });
      res.json(timetable);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch timetable" });
    }
  });

  app.post("/api/timetable", async (req, res) => {
    try {
      const entryData = insertTimetableEntrySchema.parse(req.body);
      const newEntry = await storage.createTimetableEntry(entryData);
      res.json(newEntry);
    } catch (error) {
      res.status(400).json({ message: "Invalid timetable entry" });
    }
  });

  app.put("/api/timetable/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const entryData = insertTimetableEntrySchema.parse(req.body);
      const updatedEntry = await storage.updateTimetableEntry(id, entryData);
      res.json(updatedEntry);
    } catch (error) {
      res.status(400).json({ message: "Failed to update timetable entry" });
    }
  });

  app.delete("/api/timetable/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteTimetableEntry(id);
      res.json({ message: "Timetable entry deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete timetable entry" });
    }
  });

  // Schedule generation
  app.post("/api/generate-schedule", async (req, res) => {
    try {
      const { options = {} } = req.body;
      
      // Clear existing generated entries
      await storage.clearGeneratedTimetable();
      
      // Generate new schedule
      const result = await schedulingEngine.generateSchedule({
        optimizeTeacherWorkload: options.optimizeTeacherWorkload || false,
        minimizeRoomChanges: options.minimizeRoomChanges || false,
        prioritizeMorningClasses: options.prioritizeMorningClasses || false,
        enforceHardConstraints: options.enforceHardConstraints ?? true,
        respectSoftConstraints: options.respectSoftConstraints ?? true,
      });

      if (result.success) {
        // Save generated entries
        for (const entry of result.timetableEntries) {
          await storage.createTimetableEntry(entry);
        }

        // Update schedule settings
        await storage.updateScheduleGenerated();

        res.json({
          success: true,
          message: "Schedule generated successfully",
          stats: result.stats,
          conflicts: result.conflicts,
        });
      } else {
        res.status(400).json({
          success: false,
          message: "Failed to generate schedule",
          errors: result.errors,
        });
      }
    } catch (error) {
      res.status(500).json({ message: "Schedule generation failed" });
    }
  });

  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const stats = await storage.getDashboardStats();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // Teacher-Subject assignment routes
  app.get("/api/teacher-subjects", async (req, res) => {
    try {
      const assignments = await storage.getTeacherSubjects();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch teacher-subject assignments" });
    }
  });

  app.post("/api/teacher-subjects", async (req, res) => {
    try {
      const assignment = await storage.assignTeacherToSubject(req.body);
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create teacher-subject assignment" });
    }
  });

  app.delete("/api/teacher-subjects/:id", async (req, res) => {
    try {
      await storage.deleteTeacherSubject(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete teacher-subject assignment" });
    }
  });

  // Class-Subject assignment routes
  app.get("/api/class-subjects", async (req, res) => {
    try {
      const assignments = await storage.getAllClassSubjects();
      res.json(assignments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch class-subject assignments" });
    }
  });

  app.post("/api/class-subjects", async (req, res) => {
    try {
      const assignment = await storage.assignSubjectToClass(req.body);
      res.json(assignment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create class-subject assignment" });
    }
  });

  app.delete("/api/class-subjects/:id", async (req, res) => {
    try {
      await storage.deleteClassSubject(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete class-subject assignment" });
    }
  });

  // Time Period routes
  app.get("/api/time-periods", async (req, res) => {
    try {
      const timePeriods = await storage.getTimePeriods();
      res.json(timePeriods);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch time periods" });
    }
  });

  app.post("/api/time-periods", async (req, res) => {
    try {
      const timePeriod = await storage.createTimePeriod(req.body);
      res.json(timePeriod);
    } catch (error) {
      res.status(500).json({ message: "Failed to create time period" });
    }
  });

  app.delete("/api/time-periods/:id", async (req, res) => {
    try {
      await storage.deleteTimePeriod(parseInt(req.params.id));
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete time period" });
    }
  });

  // Constraints management routes
  app.get("/api/constraints", async (req, res) => {
    try {
      const constraints = await storage.getConstraints();
      res.json(constraints);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch constraints" });
    }
  });

  app.post("/api/constraints", async (req, res) => {
    try {
      const constraintData = {
        ...req.body,
        rule: req.body.rule || {},
      };
      const constraint = await storage.createConstraint(constraintData);
      res.json(constraint);
    } catch (error) {
      console.error("Constraint creation error:", error);
      res.status(400).json({ message: "Failed to create constraint", error: String(error) });
    }
  });

  app.put("/api/constraints/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const constraintData = req.body;
      const constraint = await storage.updateConstraint(id, constraintData);
      res.json(constraint);
    } catch (error) {
      res.status(400).json({ message: "Failed to update constraint" });
    }
  });

  app.delete("/api/constraints/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await storage.deleteConstraint(id);
      res.json({ message: "Constraint deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete constraint" });
    }
  });

  // Export routes with enhanced options
  app.get("/api/export/pdf", async (req, res) => {
    try {
      const { classId, teacherId, format, includeStats, colorCoded } = req.query;
      const timetable = await storage.getTimetable({
        classId: classId ? parseInt(classId as string) : undefined,
        teacherId: teacherId ? parseInt(teacherId as string) : undefined,
      });

      const pdfBuffer = await generatePDF(timetable, {
        title: classId ? `Class Timetable` : teacherId ? `Teacher Timetable` : `Complete Timetable`,
        classId: classId ? parseInt(classId as string) : undefined,
        teacherId: teacherId ? parseInt(teacherId as string) : undefined,
        format: (format as any) || 'weekly',
        includeStats: includeStats === 'true',
        colorCoded: colorCoded === 'true',
      });

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', 'attachment; filename=timetable.pdf');
      res.send(pdfBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate PDF" });
    }
  });

  app.get("/api/export/excel", async (req, res) => {
    try {
      const { classId, teacherId } = req.query;
      const timetable = await storage.getTimetable({
        classId: classId ? parseInt(classId as string) : undefined,
        teacherId: teacherId ? parseInt(teacherId as string) : undefined,
      });

      const excelBuffer = await generateExcel(timetable, {
        title: classId ? `Class Timetable` : `Teacher Timetable`,
        classId: classId ? parseInt(classId as string) : undefined,
        teacherId: teacherId ? parseInt(teacherId as string) : undefined,
      });

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', 'attachment; filename=timetable.xlsx');
      res.send(excelBuffer);
    } catch (error) {
      res.status(500).json({ message: "Failed to generate Excel file" });
    }
  });

  // Schedule settings
  app.get("/api/settings", async (req, res) => {
    try {
      const settings = await storage.getScheduleSettings();
      res.json(settings);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch settings" });
    }
  });

  app.put("/api/settings", async (req, res) => {
    try {
      const settingsData = insertScheduleSettingsSchema.parse(req.body);
      const updatedSettings = await storage.updateScheduleSettings(settingsData);
      res.json(updatedSettings);
    } catch (error) {
      res.status(400).json({ message: "Failed to update settings" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
