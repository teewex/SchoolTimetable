import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Wand2, CheckCircle, AlertTriangle, Loader2, Clock, Users, Book } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";

interface GenerationOptions {
  optimizeTeacherWorkload: boolean;
  minimizeRoomChanges: boolean;
  prioritizeMorningClasses: boolean;
}

interface GenerationResult {
  success: boolean;
  message: string;
  stats?: {
    totalClasses: number;
    totalEntries: number;
    conflictsResolved: number;
  };
  conflicts?: string[];
}

export default function GenerateSchedule() {
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [options, setOptions] = useState<GenerationOptions>({
    optimizeTeacherWorkload: true,
    minimizeRoomChanges: false,
    prioritizeMorningClasses: true,
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentStep, setCurrentStep] = useState("");
  const [result, setResult] = useState<GenerationResult | null>(null);

  const { data: stats } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  const generateMutation = useMutation({
    mutationFn: (options: GenerationOptions) => 
      apiRequest("/api/generate-schedule", "POST", { options }),
    onSuccess: async (response) => {
      const data = await response.json();
      setResult(data);
      setIsGenerating(false);
      setProgress(100);
      
      if (data.success) {
        toast({ 
          title: "Success", 
          description: "Schedule generated successfully" 
        });
        queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
        queryClient.invalidateQueries({ queryKey: ["/api/timetable"] });
      }
    },
    onError: () => {
      setIsGenerating(false);
      setResult({
        success: false,
        message: "Failed to generate schedule. Please try again.",
      });
      toast({ 
        title: "Error", 
        description: "Failed to generate schedule", 
        variant: "destructive" 
      });
    },
  });

  const handleGenerate = () => {
    setIsGenerating(true);
    setProgress(0);
    setResult(null);
    
    // Simulate progress steps
    const steps = [
      "Loading classes and subjects...",
      "Analyzing teacher availability...",
      "Assigning time slots...",
      "Checking for conflicts...",
      "Optimizing schedule...",
      "Finalizing timetable...",
    ];

    let stepIndex = 0;
    const progressInterval = setInterval(() => {
      if (stepIndex < steps.length) {
        setCurrentStep(steps[stepIndex]);
        setProgress((stepIndex + 1) * (100 / steps.length));
        stepIndex++;
      } else {
        clearInterval(progressInterval);
      }
    }, 800);

    generateMutation.mutate(options);

    // Clear progress after completion
    setTimeout(() => {
      clearInterval(progressInterval);
    }, 5000);
  };

  const handleOptionChange = (key: keyof GenerationOptions) => {
    setOptions(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-secondary-900">Generate Timetable</h1>
          <p className="text-gray-600">
            Automatically create an optimized schedule for all classes and teachers
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Options Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Generation Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg">
                <div>
                  <p className="font-medium text-secondary-900">Optimize for Teacher Workload</p>
                  <p className="text-sm text-gray-500">Balance classes evenly among teachers</p>
                </div>
                <Checkbox
                  checked={options.optimizeTeacherWorkload}
                  onCheckedChange={() => handleOptionChange('optimizeTeacherWorkload')}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg">
                <div>
                  <p className="font-medium text-secondary-900">Minimize Room Changes</p>
                  <p className="text-sm text-gray-500">Keep classes in same rooms when possible</p>
                </div>
                <Checkbox
                  checked={options.minimizeRoomChanges}
                  onCheckedChange={() => handleOptionChange('minimizeRoomChanges')}
                />
              </div>

              <div className="flex items-center justify-between p-4 border border-secondary-200 rounded-lg">
                <div>
                  <p className="font-medium text-secondary-900">Prioritize Morning Classes</p>
                  <p className="text-sm text-gray-500">Schedule core subjects in morning slots</p>
                </div>
                <Checkbox
                  checked={options.prioritizeMorningClasses}
                  onCheckedChange={() => handleOptionChange('prioritizeMorningClasses')}
                />
              </div>

              <Button
                onClick={handleGenerate}
                disabled={isGenerating || generateMutation.isPending}
                className="w-full"
                size="lg"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Wand2 className="w-5 h-5 mr-2" />
                    Generate Schedule
                  </>
                )}
              </Button>
            </CardContent>
          </Card>

          {/* Status Panel */}
          <Card>
            <CardHeader>
              <CardTitle>Current Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* System Stats */}
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-blue-600">{stats?.totalClasses || 0}</p>
                  <p className="text-sm text-gray-600">Classes</p>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Users className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-green-600">{stats?.activeTeachers || 0}</p>
                  <p className="text-sm text-gray-600">Teachers</p>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Book className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <p className="text-2xl font-bold text-purple-600">{stats?.totalSubjects || 0}</p>
                  <p className="text-sm text-gray-600">Subjects</p>
                </div>
              </div>

              {/* Generation Progress */}
              {isGenerating && (
                <div className="space-y-4">
                  <div className="text-center">
                    <div className="w-16 h-16 border-4 border-primary/20 border-t-primary rounded-full animate-spin mx-auto mb-4"></div>
                    <h4 className="text-lg font-medium text-secondary-900 mb-2">Generating Schedule...</h4>
                    <p className="text-gray-600 mb-4">{currentStep}</p>
                    <Progress value={progress} className="w-full" />
                    <p className="text-sm text-gray-500 mt-2">Progress: {Math.round(progress)}%</p>
                  </div>
                </div>
              )}

              {/* Generation Results */}
              {result && !isGenerating && (
                <div className="space-y-4">
                  {result.success ? (
                    <div className="text-center">
                      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                      </div>
                      <h4 className="text-lg font-medium text-secondary-900 mb-2">
                        Schedule Generated Successfully!
                      </h4>
                      <p className="text-gray-600 mb-4">{result.message}</p>

                      {result.stats && (
                        <div className="grid grid-cols-3 gap-4 mb-6">
                          <div className="text-center">
                            <p className="text-2xl font-bold text-green-600">{result.stats.totalClasses}</p>
                            <p className="text-sm text-gray-600">Classes Scheduled</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-blue-600">{result.stats.totalEntries}</p>
                            <p className="text-sm text-gray-600">Time Slots Filled</p>
                          </div>
                          <div className="text-center">
                            <p className="text-2xl font-bold text-purple-600">{result.stats.conflictsResolved}</p>
                            <p className="text-sm text-gray-600">Conflicts Resolved</p>
                          </div>
                        </div>
                      )}

                      <div className="space-y-2">
                        <Button onClick={() => navigate("/timetable")} className="w-full">
                          View Timetable
                        </Button>
                        <Button variant="outline" onClick={() => navigate("/")} className="w-full">
                          Return to Dashboard
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <Alert variant="destructive">
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        {result.message}
                      </AlertDescription>
                    </Alert>
                  )}

                  {result.conflicts && result.conflicts.length > 0 && (
                    <Alert>
                      <AlertTriangle className="h-4 w-4" />
                      <AlertDescription>
                        <p className="font-medium mb-2">Conflicts detected:</p>
                        <ul className="list-disc list-inside space-y-1">
                          {result.conflicts.slice(0, 5).map((conflict, index) => (
                            <li key={index} className="text-sm">{conflict}</li>
                          ))}
                          {result.conflicts.length > 5 && (
                            <li className="text-sm font-medium">
                              ...and {result.conflicts.length - 5} more
                            </li>
                          )}
                        </ul>
                      </AlertDescription>
                    </Alert>
                  )}
                </div>
              )}

              {/* Last Generation Info */}
              {!isGenerating && !result && stats?.lastGenerated && (
                <div className="text-center py-4 text-gray-500">
                  <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">Last generated: {stats.lastGenerated}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
