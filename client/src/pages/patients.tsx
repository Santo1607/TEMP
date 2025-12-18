import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { PatientCard } from "@/components/patient-card";
import { PatientForm } from "@/components/patient-form";
import { EmptyState } from "@/components/empty-state";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, Users, Filter } from "lucide-react";
import type { PatientWithDetails, Staff, InsertPatient } from "@shared/schema";

export default function PatientsPage() {
  const { isAdmin, user } = useAuth();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [riskFilter, setRiskFilter] = useState<string>("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedPatient, setSelectedPatient] = useState<PatientWithDetails | null>(null);
  
  const patientsQueryKey = isAdmin 
    ? "/api/patients" 
    : `/api/patients?staffId=${user?.id}`;

  const { data: patients, isLoading: patientsLoading } = useQuery<PatientWithDetails[]>({
    queryKey: ["/api/patients", user?.id],
    queryFn: async () => {
      const res = await fetch(patientsQueryKey);
      if (!res.ok) throw new Error("Failed to fetch patients");
      return res.json();
    },
    enabled: !!user,
  });

  const { data: doctors } = useQuery<Staff[]>({
    queryKey: ["/api/staff/doctors"],
  });

  const { data: nurses } = useQuery<Staff[]>({
    queryKey: ["/api/staff/nurses"],
  });

  const createPatientMutation = useMutation({
    mutationFn: async (data: InsertPatient) => {
      return apiRequest("POST", "/api/patients", data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });
      setIsFormOpen(false);
      toast({
        title: "Patient added",
        description: "The patient has been successfully added to the system.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add patient. Please try again.",
        variant: "destructive",
      });
    },
  });

  const updatePatientMutation = useMutation({
    mutationFn: async (data: InsertPatient & { id: string }) => {
      return apiRequest("PATCH", `/api/patients/${data.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      setIsFormOpen(false);
      setSelectedPatient(null);
      toast({
        title: "Patient updated",
        description: "The patient information has been successfully updated.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update patient. Please try again.",
        variant: "destructive",
      });
    },
  });

  const handleOpenForm = (patient?: PatientWithDetails) => {
    setSelectedPatient(patient || null);
    setIsFormOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormOpen(false);
    setSelectedPatient(null);
  };

  const handleSubmit = async (data: InsertPatient) => {
    if (selectedPatient) {
      await updatePatientMutation.mutateAsync({ ...data, id: selectedPatient.id });
    } else {
      await createPatientMutation.mutateAsync(data);
    }
  };

  const filteredPatients = patients?.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.roomNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      patient.disease.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRisk =
      riskFilter === "all" ||
      (patient.latestTemperature?.riskLevel || "normal") === riskFilter;

    return matchesSearch && matchesRisk;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold" data-testid="text-patients-title">
            {isAdmin ? "All Patients" : "My Patients"}
          </h1>
          <p className="text-muted-foreground">
            {isAdmin
              ? "Manage and monitor all patients in the system"
              : "Monitor temperature readings for your assigned patients"}
          </p>
        </div>
        {isAdmin && (
          <Button onClick={() => handleOpenForm()} data-testid="button-add-patient">
            <Plus className="h-4 w-4 mr-2" />
            Add Patient
          </Button>
        )}
      </div>

      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search by name, room, or condition..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
            data-testid="input-search-patients"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={riskFilter} onValueChange={setRiskFilter}>
            <SelectTrigger className="w-40" data-testid="select-risk-filter">
              <SelectValue placeholder="Filter by risk" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Patients</SelectItem>
              <SelectItem value="critical">Critical</SelectItem>
              <SelectItem value="warning">Warning</SelectItem>
              <SelectItem value="normal">Normal</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {patientsLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-lg" />
          ))}
        </div>
      ) : filteredPatients && filteredPatients.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPatients.map((patient) => (
            <PatientCard
              key={patient.id}
              patient={patient}
              showActions={isAdmin}
              onEdit={isAdmin ? () => handleOpenForm(patient) : undefined}
              testId={`patient-card-${patient.id}`}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={Users}
          title={searchTerm || riskFilter !== "all" ? "No matches found" : "No patients yet"}
          description={
            searchTerm || riskFilter !== "all"
              ? "Try adjusting your search or filter criteria."
              : isAdmin
              ? "Start by adding patients to the monitoring system."
              : "No patients have been assigned to you yet."
          }
          actionLabel={isAdmin && !searchTerm ? "Add Patient" : undefined}
          onAction={isAdmin && !searchTerm ? () => handleOpenForm() : undefined}
          testId="empty-patients"
        />
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedPatient ? "Edit Patient" : "Add New Patient"}
            </DialogTitle>
            <DialogDescription>
              {selectedPatient
                ? "Update patient information and temperature thresholds."
                : "Enter patient details to add them to the monitoring system."}
            </DialogDescription>
          </DialogHeader>
          <PatientForm
            patient={selectedPatient || undefined}
            doctors={doctors || []}
            nurses={nurses || []}
            onSubmit={handleSubmit}
            onCancel={handleCloseForm}
            isLoading={createPatientMutation.isPending || updatePatientMutation.isPending}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
