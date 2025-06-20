import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Layout from "@/components/Layout";
import Dashboard from "@/pages/Dashboard";
import Classes from "@/pages/Classes";
import Subjects from "@/pages/Subjects";
import Teachers from "@/pages/Teachers";
import Rooms from "@/pages/Rooms";
import GenerateSchedule from "@/pages/GenerateSchedule";
import ViewTimetable from "@/pages/ViewTimetable";
import Settings from "@/pages/Settings";
import Constraints from "@/pages/Constraints";
import Assignments from "@/pages/Assignments";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/classes" component={Classes} />
        <Route path="/subjects" component={Subjects} />
        <Route path="/teachers" component={Teachers} />
        <Route path="/rooms" component={Rooms} />
        <Route path="/generate" component={GenerateSchedule} />
        <Route path="/timetable" component={ViewTimetable} />
        <Route path="/constraints" component={Constraints} />
        <Route path="/assignments" component={Assignments} />
        <Route path="/settings" component={Settings} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
