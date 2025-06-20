import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Presentation, Book, CheckCircle, Plus, UserPlus, Wand2, Table, ArrowUp, Bell } from "lucide-react";
import { useLocation } from "wouter";

interface DashboardStats {
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
}

export default function Dashboard() {
  const [, navigate] = useLocation();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
  });

  const quickActions = [
    {
      title: "Add New Class",
      description: "Create class groups",
      icon: Plus,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      onClick: () => navigate("/classes"),
    },
    {
      title: "Add Teacher",
      description: "Register new teacher",
      icon: UserPlus,
      bgColor: "bg-green-100",
      iconColor: "text-green-600",
      onClick: () => navigate("/teachers"),
    },
    {
      title: "Generate Schedule",
      description: "Auto-create timetable",
      icon: Wand2,
      bgColor: "bg-primary",
      iconColor: "text-white",
      textColor: "text-white",
      onClick: () => navigate("/generate"),
    },
    {
      title: "View Timetable",
      description: "Check current schedule",
      icon: Table,
      bgColor: "bg-purple-100",
      iconColor: "text-purple-600",
      onClick: () => navigate("/timetable"),
    },
  ];

  if (isLoading) {
    return (
      <div className="p-8">
        <div className="animate-pulse space-y-6">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <header className="bg-white border-b border-secondary-200 px-8 py-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-secondary-900">Dashboard</h2>
            <p className="text-gray-600 mt-1">Manage your school timetables efficiently</p>
          </div>
          
          <div className="flex items-center space-x-4">
            <button className="relative p-2 text-gray-600 hover:text-gray-900 transition-colors">
              <Bell className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                3
              </span>
            </button>
            
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-secondary-900">Admin User</p>
                <p className="text-sm text-gray-500">School Administrator</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="p-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Classes</p>
                  <p className="text-3xl font-bold text-secondary-900 mt-2">
                    {stats?.totalClasses || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                  <Users className="text-blue-600 w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500 font-medium">12%</span>
                <span className="text-gray-600 ml-1">from last term</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Active Teachers</p>
                  <p className="text-3xl font-bold text-secondary-900 mt-2">
                    {stats?.activeTeachers || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <Presentation className="text-green-600 w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <ArrowUp className="w-4 h-4 text-green-500 mr-1" />
                <span className="text-green-500 font-medium">8%</span>
                <span className="text-gray-600 ml-1">from last term</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Subjects</p>
                  <p className="text-3xl font-bold text-secondary-900 mt-2">
                    {stats?.totalSubjects || 0}
                  </p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                  <Book className="text-purple-600 w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-500 font-medium">0%</span>
                <span className="text-gray-600 ml-1">no change</span>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Schedule Status</p>
                  <p className="text-lg font-bold text-green-600 mt-2">
                    {stats?.scheduleStatus === 'generated' ? 'Generated' : 'Pending'}
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="text-green-600 w-6 h-6" />
                </div>
              </div>
              <div className="mt-4 flex items-center text-sm">
                <span className="text-gray-600">
                  {stats?.lastGenerated ? `Updated ${stats.lastGenerated}` : 'Never generated'}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Recent Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Quick Actions */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={index}
                      variant="ghost"
                      className={`w-full justify-start h-auto p-4 ${
                        action.bgColor === 'bg-primary' ? 'bg-primary hover:bg-primary/90' : 'hover:bg-primary/5'
                      }`}
                      onClick={action.onClick}
                    >
                      <div className={`w-10 h-10 ${action.bgColor} rounded-lg flex items-center justify-center mr-3`}>
                        <Icon className={`w-5 h-5 ${action.iconColor}`} />
                      </div>
                      <div className="text-left">
                        <p className={`font-medium ${action.textColor || 'text-secondary-900'}`}>
                          {action.title}
                        </p>
                        <p className={`text-sm ${action.textColor ? 'text-primary-100' : 'text-gray-500'}`}>
                          {action.description}
                        </p>
                      </div>
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </div>

          {/* Schedule Overview & Recent Activity */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Week Schedule Preview */}
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Current Week Schedule</CardTitle>
                <Button variant="outline" size="sm" onClick={() => navigate("/timetable")}>
                  View Full Schedule
                </Button>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <Table className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Generate a schedule to see the preview here</p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => navigate("/generate")}
                  >
                    Generate Schedule
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Activity</CardTitle>
              </CardHeader>
              <CardContent>
                {stats?.recentActivity?.length ? (
                  <div className="space-y-4">
                    {stats.recentActivity.map((activity, index) => (
                      <div key={index} className="flex items-start space-x-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mt-1">
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-secondary-900">
                            {activity.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-gray-500">
                    <p>No recent activity</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
