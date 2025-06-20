import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, School, Clock, Calendar, Save } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { ScheduleSettings, InsertScheduleSettings } from "@shared/schema";

const workingDaysOptions = [
  { value: "monday", label: "Monday" },
  { value: "tuesday", label: "Tuesday" },
  { value: "wednesday", label: "Wednesday" },
  { value: "thursday", label: "Thursday" },
  { value: "friday", label: "Friday" },
  { value: "saturday", label: "Saturday" },
  { value: "sunday", label: "Sunday" },
];

export default function Settings() {
  const { toast } = useToast();
  const [formData, setFormData] = useState<InsertScheduleSettings>({
    schoolName: "",
    academicYear: "",
    termName: "",
    workingDays: ["monday", "tuesday", "wednesday", "thursday", "friday"],
    breakTimes: [],
    constraints: {},
  });

  const { data: settings, isLoading } = useQuery<ScheduleSettings>({
    queryKey: ["/api/settings"],
    onSuccess: (data) => {
      if (data) {
        setFormData({
          schoolName: data.schoolName || "",
          academicYear: data.academicYear,
          termName: data.termName,
          workingDays: data.workingDays as string[] || ["monday", "tuesday", "wednesday", "thursday", "friday"],
          breakTimes: data.breakTimes || [],
          constraints: data.constraints || {},
        });
      }
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: InsertScheduleSettings) => apiRequest("PUT", "/api/settings", data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({ title: "Success", description: "Settings updated successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to update settings", variant: "destructive" });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleWorkingDayChange = (day: string, checked: boolean) => {
    const currentDays = formData.workingDays as string[];
    if (checked) {
      setFormData({
        ...formData,
        workingDays: [...currentDays, day],
      });
    } else {
      setFormData({
        ...formData,
        workingDays: currentDays.filter(d => d !== day),
      });
    }
  };

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="h-64 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-secondary-900 flex items-center space-x-2">
              <SettingsIcon className="w-6 h-6" />
              <span>Settings</span>
            </h1>
            <p className="text-gray-600">Configure your school timetable system</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* School Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <School className="w-5 h-5" />
                <span>School Information</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="schoolName">School Name</Label>
                <Input
                  id="schoolName"
                  value={formData.schoolName}
                  onChange={(e) => setFormData({ ...formData, schoolName: e.target.value })}
                  placeholder="Enter your school name"
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="academicYear">Academic Year</Label>
                  <Input
                    id="academicYear"
                    value={formData.academicYear}
                    onChange={(e) => setFormData({ ...formData, academicYear: e.target.value })}
                    placeholder="e.g., 2024-2025"
                    required
                  />
                </div>
                
                <div>
                  <Label htmlFor="termName">Current Term</Label>
                  <Select 
                    value={formData.termName} 
                    onValueChange={(value) => setFormData({ ...formData, termName: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="first">First Term</SelectItem>
                      <SelectItem value="second">Second Term</SelectItem>
                      <SelectItem value="third">Third Term</SelectItem>
                      <SelectItem value="fall">Fall Semester</SelectItem>
                      <SelectItem value="spring">Spring Semester</SelectItem>
                      <SelectItem value="summer">Summer Semester</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Schedule Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Schedule Configuration</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Label className="text-base font-medium">Working Days</Label>
                <p className="text-sm text-gray-600 mb-3">Select the days when classes are held</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {workingDaysOptions.map((day) => (
                    <div key={day.value} className="flex items-center space-x-2">
                      <Checkbox
                        id={day.value}
                        checked={(formData.workingDays as string[]).includes(day.value)}
                        onCheckedChange={(checked) => handleWorkingDayChange(day.value, !!checked)}
                      />
                      <Label htmlFor={day.value} className="text-sm font-normal">
                        {day.label}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <Separator />

              <div>
                <Label className="text-base font-medium">Time Periods</Label>
                <p className="text-sm text-gray-600 mb-3">
                  Configure your school's time periods and break times
                </p>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Time periods are automatically configured based on your schedule generation.
                    You can modify individual periods from the timetable view.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Scheduling Constraints */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Clock className="w-5 h-5" />
                <span>Scheduling Constraints</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg">
                  <div>
                    <p className="font-medium text-secondary-900">Allow Double Periods</p>
                    <p className="text-sm text-gray-500">
                      Allow subjects to have consecutive time slots
                    </p>
                  </div>
                  <Checkbox defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg">
                  <div>
                    <p className="font-medium text-secondary-900">Enforce Break Times</p>
                    <p className="text-sm text-gray-500">
                      Ensure mandatory breaks between periods
                    </p>
                  </div>
                  <Checkbox defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg">
                  <div>
                    <p className="font-medium text-secondary-900">Balance Teacher Workload</p>
                    <p className="text-sm text-gray-500">
                      Distribute classes evenly among available teachers
                    </p>
                  </div>
                  <Checkbox defaultChecked />
                </div>

                <div className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg">
                  <div>
                    <p className="font-medium text-secondary-900">Prefer Morning Core Subjects</p>
                    <p className="text-sm text-gray-500">
                      Schedule important subjects in morning time slots
                    </p>
                  </div>
                  <Checkbox defaultChecked />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline">
              Reset to Defaults
            </Button>
            <Button 
              type="submit" 
              disabled={updateMutation.isPending}
              className="min-w-[120px]"
            >
              {updateMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
