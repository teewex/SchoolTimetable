import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Plus, Edit, Trash2, Shield, AlertTriangle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const constraintSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string().optional(),
  type: z.enum(["hard", "soft"]),
  scope: z.enum(["subject", "teacher", "class", "room", "global"]),
  targetId: z.number().optional(),
  rule: z.object({}).optional(),
  priority: z.number().min(1).max(10).default(5),
  isActive: z.boolean().default(true),
});

type ConstraintFormData = z.infer<typeof constraintSchema>;

export default function Constraints() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConstraint, setEditingConstraint] = useState<any>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const form = useForm<ConstraintFormData>({
    resolver: zodResolver(constraintSchema),
    defaultValues: {
      name: "",
      description: "",
      type: "soft",
      scope: "global",
      priority: 5,
      isActive: true,
    },
  });

  const { data: constraints = [], isLoading } = useQuery({
    queryKey: ["/api/constraints"],
  });

  const { data: subjects = [] } = useQuery({
    queryKey: ["/api/subjects"],
  });

  const { data: teachers = [] } = useQuery({
    queryKey: ["/api/teachers"],
  });

  const { data: classes = [] } = useQuery({
    queryKey: ["/api/classes"],
  });

  const { data: rooms = [] } = useQuery({
    queryKey: ["/api/rooms"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: ConstraintFormData) => {
      const response = await apiRequest("/api/constraints", "POST", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/constraints"] });
      setDialogOpen(false);
      form.reset();
      toast({ title: "Constraint created successfully" });
    },
    onError: () => {
      toast({ title: "Failed to create constraint", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: ConstraintFormData }) => {
      const response = await apiRequest(`/api/constraints/${id}`, "PUT", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/constraints"] });
      setDialogOpen(false);
      setEditingConstraint(null);
      form.reset();
      toast({ title: "Constraint updated successfully" });
    },
    onError: () => {
      toast({ title: "Failed to update constraint", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/constraints/${id}`, "DELETE");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/constraints"] });
      toast({ title: "Constraint deleted successfully" });
    },
    onError: () => {
      toast({ title: "Failed to delete constraint", variant: "destructive" });
    },
  });

  const handleSubmit = (data: ConstraintFormData) => {
    if (editingConstraint) {
      updateMutation.mutate({ id: editingConstraint.id, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleEdit = (constraint: any) => {
    setEditingConstraint(constraint);
    form.reset({
      name: constraint.name,
      description: constraint.description || "",
      type: constraint.type,
      scope: constraint.scope,
      targetId: constraint.targetId || undefined,
      priority: constraint.priority,
      isActive: constraint.isActive,
    });
    setDialogOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Are you sure you want to delete this constraint?")) {
      deleteMutation.mutate(id);
    }
  };

  const getTargetOptions = (scope: string) => {
    switch (scope) {
      case "subject":
        return subjects.map((s: any) => ({ value: s.id, label: s.name }));
      case "teacher":
        return teachers.map((t: any) => ({ value: t.id, label: t.name }));
      case "class":
        return classes.map((c: any) => ({ value: c.id, label: `${c.name} (${c.level} ${c.section})` }));
      case "room":
        return rooms.map((r: any) => ({ value: r.id, label: r.name }));
      default:
        return [];
    }
  };

  const getConstraintTypeIcon = (type: string) => {
    return type === "hard" ? <Shield className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />;
  };

  const getConstraintTypeColor = (type: string) => {
    return type === "hard" ? "destructive" : "secondary";
  };

  if (isLoading) {
    return <div className="p-6">Loading constraints...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Constraint Management</h1>
          <p className="text-gray-600">Configure scheduling rules and constraints</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Constraint
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingConstraint ? "Edit Constraint" : "Create Constraint"}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Math Morning Only" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Describe this constraint..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Type</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="hard">Hard (Must be enforced)</SelectItem>
                            <SelectItem value="soft">Soft (Preferred)</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="scope"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scope</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select scope" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="global">Global</SelectItem>
                            <SelectItem value="subject">Subject</SelectItem>
                            <SelectItem value="teacher">Teacher</SelectItem>
                            <SelectItem value="class">Class</SelectItem>
                            <SelectItem value="room">Room</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {form.watch("scope") !== "global" && (
                  <FormField
                    control={form.control}
                    name="targetId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} 
                                value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select target" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {getTargetOptions(form.watch("scope")).map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="priority"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Priority (1-10)</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="10" {...field} 
                                 onChange={(e) => field.onChange(parseInt(e.target.value))} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="isActive"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                        <div className="space-y-0.5">
                          <FormLabel>Active</FormLabel>
                        </div>
                        <FormControl>
                          <Switch checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                      </FormItem>
                    )}
                  />
                </div>

                <div className="flex justify-end space-x-2">
                  <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                    {editingConstraint ? "Update" : "Create"}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {constraints.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-gray-500">No constraints configured</p>
              <p className="text-sm text-gray-400">Add constraints to customize scheduling behavior</p>
            </CardContent>
          </Card>
        ) : (
          constraints.map((constraint: any) => (
            <Card key={constraint.id} className={!constraint.isActive ? "opacity-50" : ""}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="flex items-center gap-2">
                      {getConstraintTypeIcon(constraint.type)}
                      {constraint.name}
                      <Badge variant={getConstraintTypeColor(constraint.type)}>
                        {constraint.type}
                      </Badge>
                      <Badge variant="outline">
                        {constraint.scope}
                      </Badge>
                      {constraint.priority > 7 && (
                        <Badge variant="destructive">High Priority</Badge>
                      )}
                    </CardTitle>
                    {constraint.description && (
                      <p className="text-sm text-gray-600">{constraint.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" onClick={() => handleEdit(constraint)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(constraint.id)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-medium">Priority:</span> {constraint.priority}/10
                  </div>
                  <div>
                    <span className="font-medium">Status:</span> {constraint.isActive ? "Active" : "Inactive"}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}