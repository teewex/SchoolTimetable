import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trash2, Plus, Users, BookOpen, MapPin, Clock } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { queryClient } from "@/lib/queryClient";

// Schema definitions
const teacherSubjectSchema = z.object({
  teacherId: z.number(),
  subjectId: z.number(),
});

const classSubjectSchema = z.object({
  classId: z.number(),
  subjectId: z.number(),
  teacherId: z.number().optional(),
  preferredRoomId: z.number().optional(),
});

const timePeriodSchema = z.object({
  name: z.string().min(1, "Name is required"),
  startTime: z.string().min(1, "Start time is required"),
  endTime: z.string().min(1, "End time is required"),
  dayOfWeek: z.enum(["monday", "tuesday", "wednesday", "thursday", "friday"]),
  isBreak: z.boolean().default(false),
  orderIndex: z.number(),
});

type TeacherSubjectForm = z.infer<typeof teacherSubjectSchema>;
type ClassSubjectForm = z.infer<typeof classSubjectSchema>;
type TimePeriodForm = z.infer<typeof timePeriodSchema>;

export default function Assignments() {
  const [activeTab, setActiveTab] = useState("teacher-subject");
  const [openDialog, setOpenDialog] = useState<string | null>(null);

  // Fetch data
  const { data: teachers = [] } = useQuery({ queryKey: ["/api/teachers"] });
  const { data: subjects = [] } = useQuery({ queryKey: ["/api/subjects"] });
  const { data: classes = [] } = useQuery({ queryKey: ["/api/classes"] });
  const { data: rooms = [] } = useQuery({ queryKey: ["/api/rooms"] });
  const { data: teacherSubjects = [] } = useQuery({ queryKey: ["/api/teacher-subjects"] });
  const { data: classSubjects = [] } = useQuery({ queryKey: ["/api/class-subjects"] });
  const { data: timePeriods = [] } = useQuery({ queryKey: ["/api/time-periods"] });

  // Teacher-Subject Assignment
  const teacherSubjectForm = useForm<TeacherSubjectForm>({
    resolver: zodResolver(teacherSubjectSchema),
  });

  const createTeacherSubjectMutation = useMutation({
    mutationFn: async (data: TeacherSubjectForm) => {
      const response = await fetch("/api/teacher-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create assignment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-subjects"] });
      toast({ title: "Success", description: "Teacher-subject assignment created" });
      setOpenDialog(null);
      teacherSubjectForm.reset();
    },
  });

  const deleteTeacherSubjectMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/teacher-subjects/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete assignment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher-subjects"] });
      toast({ title: "Success", description: "Assignment deleted" });
    },
  });

  // Class-Subject Assignment
  const classSubjectForm = useForm<ClassSubjectForm>({
    resolver: zodResolver(classSubjectSchema),
  });

  const createClassSubjectMutation = useMutation({
    mutationFn: async (data: ClassSubjectForm) => {
      const response = await fetch("/api/class-subjects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create assignment");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/class-subjects"] });
      toast({ title: "Success", description: "Class-subject assignment created" });
      setOpenDialog(null);
      classSubjectForm.reset();
    },
  });

  const deleteClassSubjectMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/class-subjects/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete assignment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/class-subjects"] });
      toast({ title: "Success", description: "Assignment deleted" });
    },
  });

  // Time Period Management
  const timePeriodForm = useForm<TimePeriodForm>({
    resolver: zodResolver(timePeriodSchema),
    defaultValues: {
      isBreak: false,
      orderIndex: 1,
    },
  });

  const createTimePeriodMutation = useMutation({
    mutationFn: async (data: TimePeriodForm) => {
      const response = await fetch("/api/time-periods", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!response.ok) throw new Error("Failed to create time period");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-periods"] });
      toast({ title: "Success", description: "Time period created" });
      setOpenDialog(null);
      timePeriodForm.reset();
    },
  });

  const deleteTimePeriodMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/time-periods/${id}`, {
        method: "DELETE",
      });
      if (!response.ok) throw new Error("Failed to delete time period");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/time-periods"] });
      toast({ title: "Success", description: "Time period deleted" });
    },
  });

  // Helper functions
  const getTeacherName = (teacherId: number) => 
    teachers.find((t: any) => t.id === teacherId)?.name || "Unknown";
  
  const getSubjectName = (subjectId: number) => 
    subjects.find((s: any) => s.id === subjectId)?.name || "Unknown";
  
  const getClassName = (classId: number) => 
    classes.find((c: any) => c.id === classId)?.name || "Unknown";
  
  const getRoomName = (roomId: number) => 
    rooms.find((r: any) => r.id === roomId)?.name || "Unknown";

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Assignment Management</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="teacher-subject">Teacher-Subject</TabsTrigger>
          <TabsTrigger value="class-subject">Class-Subject</TabsTrigger>
          <TabsTrigger value="time-periods">Time Periods</TabsTrigger>
          <TabsTrigger value="schedule-settings">Schedule Settings</TabsTrigger>
        </TabsList>

        {/* Teacher-Subject Assignments */}
        <TabsContent value="teacher-subject" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Users className="h-5 w-5" />
              Teacher-Subject Assignments
            </h2>
            <Dialog open={openDialog === "teacher-subject"} onOpenChange={(open) => setOpenDialog(open ? "teacher-subject" : null)}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assignment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Teacher-Subject Assignment</DialogTitle>
                </DialogHeader>
                <Form {...teacherSubjectForm}>
                  <form onSubmit={teacherSubjectForm.handleSubmit((data) => createTeacherSubjectMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={teacherSubjectForm.control}
                      name="teacherId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Teacher</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select teacher" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {teachers.map((teacher: any) => (
                                <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                  {teacher.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={teacherSubjectForm.control}
                      name="subjectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subjects.map((subject: any) => (
                                <SelectItem key={subject.id} value={subject.id.toString()}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={createTeacherSubjectMutation.isPending}>
                      {createTeacherSubjectMutation.isPending ? "Creating..." : "Create Assignment"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {teacherSubjects.map((assignment: any) => (
              <Card key={assignment.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{getTeacherName(assignment.teacherId)}</p>
                        <p className="text-sm text-muted-foreground">{getSubjectName(assignment.subjectId)}</p>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteTeacherSubjectMutation.mutate(assignment.id)}
                      disabled={deleteTeacherSubjectMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Class-Subject Assignments */}
        <TabsContent value="class-subject" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Class-Subject Assignments
            </h2>
            <Dialog open={openDialog === "class-subject"} onOpenChange={(open) => setOpenDialog(open ? "class-subject" : null)}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Assignment
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Class-Subject Assignment</DialogTitle>
                </DialogHeader>
                <Form {...classSubjectForm}>
                  <form onSubmit={classSubjectForm.handleSubmit((data) => createClassSubjectMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={classSubjectForm.control}
                      name="classId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select class" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {classes.map((cls: any) => (
                                <SelectItem key={cls.id} value={cls.id.toString()}>
                                  {cls.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={classSubjectForm.control}
                      name="subjectId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Subject</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select subject" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {subjects.map((subject: any) => (
                                <SelectItem key={subject.id} value={subject.id.toString()}>
                                  {subject.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={classSubjectForm.control}
                      name="teacherId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Teacher (Optional)</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select teacher" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {teachers.map((teacher: any) => (
                                <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                  {teacher.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={classSubjectForm.control}
                      name="preferredRoomId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Preferred Room (Optional)</FormLabel>
                          <Select onValueChange={(value) => field.onChange(value ? parseInt(value) : undefined)}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select room" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {rooms.map((room: any) => (
                                <SelectItem key={room.id} value={room.id.toString()}>
                                  {room.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <Button type="submit" disabled={createClassSubjectMutation.isPending}>
                      {createClassSubjectMutation.isPending ? "Creating..." : "Create Assignment"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {classSubjects.map((assignment: any) => (
              <Card key={assignment.id}>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div>
                        <p className="font-medium">{getClassName(assignment.classId)} - {getSubjectName(assignment.subjectId)}</p>
                        <div className="flex gap-2 mt-1">
                          {assignment.teacherId && (
                            <Badge variant="secondary">{getTeacherName(assignment.teacherId)}</Badge>
                          )}
                          {assignment.preferredRoomId && (
                            <Badge variant="outline">{getRoomName(assignment.preferredRoomId)}</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => deleteClassSubjectMutation.mutate(assignment.id)}
                      disabled={deleteClassSubjectMutation.isPending}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Time Periods */}
        <TabsContent value="time-periods" className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Time Periods & Schedule
            </h2>
            <Dialog open={openDialog === "time-period"} onOpenChange={(open) => setOpenDialog(open ? "time-period" : null)}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Time Period
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create Time Period</DialogTitle>
                </DialogHeader>
                <Form {...timePeriodForm}>
                  <form onSubmit={timePeriodForm.handleSubmit((data) => createTimePeriodMutation.mutate(data))} className="space-y-4">
                    <FormField
                      control={timePeriodForm.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Period 1, Break, Lunch" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={timePeriodForm.control}
                        name="startTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Start Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={timePeriodForm.control}
                        name="endTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>End Time</FormLabel>
                            <FormControl>
                              <Input type="time" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <FormField
                      control={timePeriodForm.control}
                      name="dayOfWeek"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Day of Week</FormLabel>
                          <Select onValueChange={field.onChange}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select day" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="monday">Monday</SelectItem>
                              <SelectItem value="tuesday">Tuesday</SelectItem>
                              <SelectItem value="wednesday">Wednesday</SelectItem>
                              <SelectItem value="thursday">Thursday</SelectItem>
                              <SelectItem value="friday">Friday</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={timePeriodForm.control}
                        name="orderIndex"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Order</FormLabel>
                            <FormControl>
                              <Input type="number" min="1" {...field} onChange={(e) => field.onChange(parseInt(e.target.value))} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={timePeriodForm.control}
                        name="isBreak"
                        render={({ field }) => (
                          <FormItem className="flex items-center space-x-2 space-y-0 pt-6">
                            <FormControl>
                              <input
                                type="checkbox"
                                checked={field.value}
                                onChange={field.onChange}
                                className="rounded border-gray-300"
                              />
                            </FormControl>
                            <FormLabel className="text-sm font-normal">
                              Is Break Period
                            </FormLabel>
                          </FormItem>
                        )}
                      />
                    </div>
                    <Button type="submit" disabled={createTimePeriodMutation.isPending}>
                      {createTimePeriodMutation.isPending ? "Creating..." : "Create Time Period"}
                    </Button>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid gap-4">
            {Object.entries(
              timePeriods.reduce((acc: any, period: any) => {
                if (!acc[period.dayOfWeek]) acc[period.dayOfWeek] = [];
                acc[period.dayOfWeek].push(period);
                return acc;
              }, {})
            ).map(([day, periods]) => (
              <Card key={day}>
                <CardHeader>
                  <CardTitle className="capitalize">{day}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {(periods as any[])
                      .sort((a, b) => a.orderIndex - b.orderIndex)
                      .map((period) => (
                        <div key={period.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div>
                              <p className="font-medium">{period.name}</p>
                              <p className="text-sm text-muted-foreground">
                                {period.startTime} - {period.endTime}
                              </p>
                            </div>
                            {period.isBreak && (
                              <Badge variant="outline">Break</Badge>
                            )}
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteTimePeriodMutation.mutate(period.id)}
                            disabled={deleteTimePeriodMutation.isPending}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Schedule Settings */}
        <TabsContent value="schedule-settings" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Schedule Configuration</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">School Start Time</label>
                  <Input type="time" defaultValue="08:00" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">School End Time</label>
                  <Input type="time" defaultValue="15:00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Period Duration (minutes)</label>
                  <Input type="number" defaultValue="40" min="1" max="120" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Break Duration (minutes)</label>
                  <Input type="number" defaultValue="20" min="5" max="60" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Lunch Duration (minutes)</label>
                  <Input type="number" defaultValue="40" min="15" max="90" />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Maximum Periods per Day</label>
                  <Input type="number" defaultValue="7" min="1" max="12" />
                </div>
              </div>
              <Button className="w-full">Save Schedule Settings</Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}