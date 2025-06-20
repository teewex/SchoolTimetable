import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Download, FileText, Table, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  classId?: number;
  teacherId?: number;
  viewMode: "class" | "teacher" | "overview";
}

type ExportFormat = "pdf" | "excel";
type ExportScope = "current" | "all-classes" | "all-teachers";

export default function ExportDialog({
  open,
  onOpenChange,
  classId,
  teacherId,
  viewMode,
}: ExportDialogProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState<ExportFormat>("pdf");
  const [scope, setScope] = useState<ExportScope>("current");

  const exportMutation = useMutation({
    mutationFn: async ({ format, scope }: { format: ExportFormat; scope: ExportScope }) => {
      let url = `/api/export/${format}`;
      const params = new URLSearchParams();

      // Determine export parameters based on scope and current view
      if (scope === "current") {
        if (viewMode === "class" && classId) {
          params.append("classId", classId.toString());
        } else if (viewMode === "teacher" && teacherId) {
          params.append("teacherId", teacherId.toString());
        }
        // For overview mode, export everything (no additional params)
      } else if (scope === "all-classes") {
        // Export all classes (no specific classId)
      } else if (scope === "all-teachers") {
        // Export all teachers (no specific teacherId)
      }

      if (params.toString()) {
        url += `?${params.toString()}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      return response.blob();
    },
    onSuccess: (blob, variables) => {
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      
      // Generate filename
      const timestamp = new Date().toISOString().split('T')[0];
      const extension = variables.format === 'pdf' ? 'pdf' : 'xlsx';
      let filename = `timetable-${timestamp}.${extension}`;
      
      if (variables.scope === "current") {
        if (viewMode === "class" && classId) {
          filename = `class-timetable-${classId}-${timestamp}.${extension}`;
        } else if (viewMode === "teacher" && teacherId) {
          filename = `teacher-timetable-${teacherId}-${timestamp}.${extension}`;
        }
      } else if (variables.scope === "all-classes") {
        filename = `all-classes-timetable-${timestamp}.${extension}`;
      } else if (variables.scope === "all-teachers") {
        filename = `all-teachers-timetable-${timestamp}.${extension}`;
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      
      // Cleanup
      window.URL.revokeObjectURL(url);
      document.body.removeChild(link);
      
      toast({
        title: "Success",
        description: `Timetable exported as ${variables.format.toUpperCase()} successfully`,
      });
      
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to export timetable. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleExport = () => {
    exportMutation.mutate({ format, scope });
  };

  const getScopeOptions = () => {
    const options = [
      { value: "current", label: "Current View" },
      { value: "all-classes", label: "All Classes" },
      { value: "all-teachers", label: "All Teachers" },
    ];

    return options;
  };

  const getScopeDescription = () => {
    switch (scope) {
      case "current":
        if (viewMode === "class" && classId) {
          return "Export timetable for the currently selected class";
        } else if (viewMode === "teacher" && teacherId) {
          return "Export timetable for the currently selected teacher";
        } else {
          return "Export the complete school timetable overview";
        }
      case "all-classes":
        return "Export separate timetables for all classes";
      case "all-teachers":
        return "Export separate timetables for all teachers";
      default:
        return "";
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Download className="w-5 h-5" />
            <span>Export Timetable</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Format Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Format</Label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                type="button"
                variant={format === "pdf" ? "default" : "outline"}
                onClick={() => setFormat("pdf")}
                className="flex items-center space-x-2 justify-start h-auto p-4"
              >
                <FileText className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">PDF</div>
                  <div className="text-xs opacity-70">Printable format</div>
                </div>
              </Button>
              
              <Button
                type="button"
                variant={format === "excel" ? "default" : "outline"}
                onClick={() => setFormat("excel")}
                className="flex items-center space-x-2 justify-start h-auto p-4"
              >
                <Table className="w-5 h-5" />
                <div className="text-left">
                  <div className="font-medium">Excel</div>
                  <div className="text-xs opacity-70">Editable spreadsheet</div>
                </div>
              </Button>
            </div>
          </div>

          <Separator />

          {/* Scope Selection */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Export Scope</Label>
            <Select value={scope} onValueChange={setScope}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {getScopeOptions().map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-sm text-gray-600">{getScopeDescription()}</p>
          </div>

          <Separator />

          {/* Export Button */}
          <div className="flex justify-end space-x-3">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleExport}
              disabled={exportMutation.isPending}
              className="min-w-[120px]"
            >
              {exportMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4 mr-2" />
                  Export {format.toUpperCase()}
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
