import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, Download, Eye, Calendar } from "lucide-react";
import TimetableGrid from "@/components/TimetableGrid";
import ExportDialog from "@/components/ExportDialog";
import type { Class, Teacher, TimetableEntry } from "@shared/schema";

type ViewMode = "class" | "teacher" | "overview";

export default function ViewTimetable() {
  const [viewMode, setViewMode] = useState<ViewMode>("overview");
  const [selectedClassId, setSelectedClassId] = useState<number | undefined>();
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | undefined>();
  const [showExportDialog, setShowExportDialog] = useState(false);

  const { data: classes } = useQuery<Class[]>({
    queryKey: ["/api/classes"],
  });

  const { data: teachers } = useQuery<Teacher[]>({
    queryKey: ["/api/teachers"],
  });

  const { data: timetableData, isLoading: timetableLoading } = useQuery({
    queryKey: ["/api/timetable", selectedClassId, selectedTeacherId],
    queryParams: {
      ...(selectedClassId && { classId: selectedClassId }),
      ...(selectedTeacherId && { teacherId: selectedTeacherId }),
    },
  });

  const handleViewModeChange = (mode: ViewMode) => {
    setViewMode(mode);
    if (mode === "overview") {
      setSelectedClassId(undefined);
      setSelectedTeacherId(undefined);
    }
  };

  const handleClassChange = (classId: string) => {
    setSelectedClassId(parseInt(classId));
    setSelectedTeacherId(undefined);
  };

  const handleTeacherChange = (teacherId: string) => {
    setSelectedTeacherId(parseInt(teacherId));
    setSelectedClassId(undefined);
  };

  const selectedClass = classes?.find(c => c.id === selectedClassId);
  const selectedTeacher = teachers?.find(t => t.id === selectedTeacherId);

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-900">View Timetable</h1>
          <p className="text-gray-600">Browse and manage your school schedules</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <Button variant="outline" onClick={() => setShowExportDialog(true)}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* View Mode Tabs */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Eye className="w-5 h-5" />
              <span>View Options</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Tabs value={viewMode} onValueChange={handleViewModeChange}>
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="class">By Class</TabsTrigger>
                <TabsTrigger value="teacher">By Teacher</TabsTrigger>
              </TabsList>

              <div className="mt-6">
                <TabsContent value="class" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Class
                    </label>
                    <Select value={selectedClassId?.toString()} onValueChange={handleClassChange}>
                      <SelectTrigger className="w-full max-w-md">
                        <SelectValue placeholder="Choose a class to view" />
                      </SelectTrigger>
                      <SelectContent>
                        {classes?.map((classObj) => (
                          <SelectItem key={classObj.id} value={classObj.id.toString()}>
                            {classObj.name} - {classObj.level} {classObj.section}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="teacher" className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Teacher
                    </label>
                    <Select value={selectedTeacherId?.toString()} onValueChange={handleTeacherChange}>
                      <SelectTrigger className="w-full max-w-md">
                        <SelectValue placeholder="Choose a teacher to view" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers?.map((teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id.toString()}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </TabsContent>

                <TabsContent value="overview">
                  <p className="text-gray-600">
                    Viewing complete school timetable overview
                  </p>
                </TabsContent>
              </div>
            </Tabs>
          </CardContent>
        </Card>

        {/* Timetable Display */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Calendar className="w-5 h-5" />
              <span>
                {viewMode === "class" && selectedClass
                  ? `${selectedClass.name} - ${selectedClass.level} ${selectedClass.section}`
                  : viewMode === "teacher" && selectedTeacher
                  ? selectedTeacher.name
                  : "Weekly Timetable"}
              </span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {timetableLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                <span className="ml-2 text-gray-600">Loading timetable...</span>
              </div>
            ) : !timetableData || timetableData.length === 0 ? (
              <div className="text-center py-12 text-gray-500">
                <Table className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2">No timetable data found</p>
                <p className="text-sm">
                  {viewMode === "overview" 
                    ? "Generate a schedule to see the timetable"
                    : "No schedule found for the selected filter"}
                </p>
              </div>
            ) : (
              <TimetableGrid
                data={timetableData}
                viewMode={viewMode}
                selectedClassId={selectedClassId}
                selectedTeacherId={selectedTeacherId}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        classId={selectedClassId}
        teacherId={selectedTeacherId}
        viewMode={viewMode}
      />
    </div>
  );
}
