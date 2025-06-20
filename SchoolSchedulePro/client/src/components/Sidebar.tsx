import { useLocation } from "wouter";
import { Calendar, Users, Book, Presentation, DoorOpen, Wand2, Table, Download, Settings, BarChart3, Shield, Link2 } from "lucide-react";
import { cn } from "@/lib/utils";

const navigationItems = [
  { href: "/", label: "Dashboard", icon: BarChart3 },
  { href: "/classes", label: "Classes", icon: Users },
  { href: "/subjects", label: "Subjects", icon: Book },
  { href: "/teachers", label: "Teachers", icon: Presentation },
  { href: "/rooms", label: "Rooms", icon: DoorOpen },
  { separator: true },
  { href: "/generate", label: "Generate Schedule", icon: Wand2 },
  { href: "/timetable", label: "View Timetable", icon: Table },
  { href: "/constraints", label: "Constraints", icon: Shield },
  { href: "/assignments", label: "Assignments", icon: Link2 },
  { href: "/export", label: "Export", icon: Download },
  { separator: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  const [location, navigate] = useLocation();

  return (
    <aside className="w-64 bg-white shadow-lg border-r border-secondary-200">
      <div className="p-6 border-b border-secondary-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
            <Calendar className="text-white text-lg" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-secondary-900">EduScheduler</h1>
            <p className="text-sm text-gray-500">v1.0.0</p>
          </div>
        </div>
      </div>

      <nav className="p-4 space-y-2">
        {navigationItems.map((item, index) => {
          if (item.separator) {
            return <div key={index} className="pt-4 border-t border-secondary-200" />;
          }

          const Icon = item.icon!;
          const isActive = location === item.href;

          return (
            <button
              key={item.href}
              onClick={() => navigate(item.href!)}
              className={cn(
                "w-full flex items-center space-x-3 px-4 py-3 rounded-lg text-left transition-colors",
                isActive
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-gray-700 hover:bg-secondary-100"
              )}
            >
              <Icon className="w-5 h-5" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>
    </aside>
  );
}
