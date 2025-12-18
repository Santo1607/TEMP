import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { DataTable, type Column } from "@/components/data-table";
import { StaffForm } from "@/components/staff-form";
import { EmptyState } from "@/components/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Search, UserCog } from "lucide-react";
import type { Staff, InsertStaff } from "@shared/schema";

export default function StaffPage() {
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);

  const { data: allStaff, isLoading } = useQuery<Staff[]>({
    queryKey: ["/api/staff"],
  });

  const createStaffMutation = useMutation({
    mutationFn: async (data: InsertStaff) => {
      return apiRequest("POST", "/api/staff", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setIsFormOpen(false);
      toast({
        title: "Staff member added",
        description: "The staff member has been successfully added.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add staff member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updateStaffMutation = useMutation({
    mutationFn: async (data: InsertStaff & { id: string }) => {
      return apiRequest("PATCH", `/api/staff/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setIsFormOpen(false);
      setSelectedStaff(null);
      toast({
        title: "Staff member updated",
        description: "The staff information has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update staff member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const deleteStaffMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/staff/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/staff"] });
      setDeleteConfirmOpen(false);
      setStaffToDelete(null);
      toast({
        title: "Staff member removed",
        description: "The staff member has been removed from the system.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to remove staff member. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOpenForm = (staff?: Staff) => {
    setSelectedStaff(staff || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedStaff(null);
  };

  const handleSubmit = async (data: InsertStaff) => {
    if (selectedStaff) {
      await updateStaffMutation.mutateAsync({ ...data, id: selectedStaff.id });
    } else {
      await createStaffMutation.mutateAsync(data);
    }
  };

  const handleDeleteClick = (staff: Staff) => {
    setStaffToDelete(staff);
    setDeleteConfirmOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (staffToDelete) {
      await deleteStaffMutation.mutateAsync(staffToDelete.id);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return <Badge variant="default">Admin</Badge>;
      case "doctor":
        return <Badge variant="secondary">Doctor</Badge>;
      case "nurse":
        return <Badge variant="outline">Nurse</Badge>;
      default:
        return <Badge>{role}</Badge>;
    }
  };

  const columns: Column<Staff>[] = [
    { key: "name", header: "Name" },
    { key: "email", header: "Email" },
    { key: "phone", header: "Phone" },
    {
      key: "role",
      header: "Role",
      render: (staff) => getRoleBadge(staff.role),
    },
  ];

  const filteredStaff = allStaff?.filter((staff) => {
    const matchesSearch =
      staff.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      staff.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesTab =
      activeTab === "all" || staff.role === activeTab;

    return matchesSearch && matchesTab;
  });

  const getCounts = () => {
    if (!allStaff) return { all: 0, admin: 0, doctor: 0, nurse: 0 };
    return {
      all: allStaff.length,
      admin: allStaff.filter((s) => s.role === "admin").length,
      doctor: allStaff.filter((s) => s.role === "doctor").length,
      nurse: allStaff.filter((s) => s.role === "nurse").length,
    };
  };

  const counts = getCounts();

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-staff-title">
            Staff Management
          </h1>
          <p className="text-muted-foreground">
            Manage doctors, nurses, and administrators
          </p>
        </div>
        <Button onClick={() => handleOpenForm()} data-testid="button-add-staff">
          <Plus className="h-4 w-4 mr-2" />
          Add Staff
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <TabsList>
            <TabsTrigger value="all" data-testid="tab-all">
              All ({counts.all})
            </TabsTrigger>
            <TabsTrigger value="doctor" data-testid="tab-doctors">
              Doctors ({counts.doctor})
            </TabsTrigger>
            <TabsTrigger value="nurse" data-testid="tab-nurses">
              Nurses ({counts.nurse})
            </TabsTrigger>
            <TabsTrigger value="admin" data-testid="tab-admins">
              Admins ({counts.admin})
            </TabsTrigger>
          </TabsList>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search staff..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full sm:w-64"
              data-testid="input-search-staff"
            />
          </div>
        </div>

        <TabsContent value={activeTab} className="mt-6">
          {isLoading ? (
            <DataTable
              columns={columns}
              data={[]}
              keyField="id"
              isLoading={true}
              testIdPrefix="staff"
            />
          ) : filteredStaff && filteredStaff.length > 0 ? (
            <DataTable
              columns={columns}
              data={filteredStaff}
              keyField="id"
              onEdit={handleOpenForm}
              onDelete={handleDeleteClick}
              testIdPrefix="staff"
            />
          ) : (
            <EmptyState
              icon={UserCog}
              title={searchTerm ? "No matches found" : "No staff members"}
              description={
                searchTerm
                  ? "Try adjusting your search criteria."
                  : "Start by adding staff members to the system."
              }
              actionLabel={!searchTerm ? "Add Staff" : undefined}
              onAction={!searchTerm ? () => handleOpenForm() : undefined}
              testId="empty-staff"
            />
          )}
        </TabsContent>
      </Tabs>

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedStaff ? "Edit Staff Member" : "Add New Staff Member"}
            </DialogTitle>
            <DialogDescription>
              {selectedStaff
                ? "Update staff member information."
                : "Enter details to add a new staff member."}
            </DialogDescription>
          </DialogHeader>
          <StaffForm
            staff={selectedStaff || undefined}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
            isLoading={createStaffMutation.isPending || updateStaffMutation.isPending}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {staffToDelete?.name} from the system?
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-delete">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground"
              data-testid="button-confirm-delete"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
