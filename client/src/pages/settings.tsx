import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import { useTheme } from "@/lib/theme-context";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { diseaseThresholds } from "@shared/schema";
import type { PatientWithDetails } from "@shared/schema";
import { Sun, Moon, Bell, Thermometer, Loader2, Phone, User, Stethoscope, Heart, Save } from "lucide-react";

export default function SettingsPage() {
  const { user } = useAuth();
  const { theme, setTheme } = useTheme();
  const { toast } = useToast();
  const [smsEnabled, setSmsEnabled] = useState(true);

  // Patient and contact form state
  const [patientName, setPatientName] = useState("");
  const [roomNumber, setRoomNumber] = useState("");
  const [floorNumber, setFloorNumber] = useState("");
  const [blockNumber, setBlockNumber] = useState("");
  const [guardianName, setGuardianName] = useState("");
  const [guardianPhone, setGuardianPhone] = useState("");
  const [doctorPhone, setDoctorPhone] = useState("");
  const [nursePhone, setNursePhone] = useState("");
  const [thresholdMin, setThresholdMin] = useState("36.5");
  const [thresholdMax, setThresholdMax] = useState("37.5");

  // Fetch the single patient
  const { data: patients, isLoading: patientsLoading } = useQuery<PatientWithDetails[]>({
    queryKey: ["/api/patients"],
  });

  const patient = patients?.[0];

  // Load patient data into form
  useEffect(() => {
    if (patient) {
      setPatientName(patient.name);
      setRoomNumber(patient.roomNumber);
      setFloorNumber(patient.floorNumber);
      setBlockNumber(patient.blockNumber);
      setGuardianName(patient.guardianName);
      setGuardianPhone(patient.guardianPhone);
      setDoctorPhone(patient.doctor?.phone || "");
      setNursePhone(patient.nurse?.phone || "");
      setThresholdMin(patient.thresholdMin.toString());
      setThresholdMax(patient.thresholdMax.toString());
    }
  }, [patient]);

  // Update patient mutation
  const updatePatientMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest("PATCH", `/api/patients/${patient?.id}`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Patient updated",
        description: "Patient details have been saved successfully.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update patient details.",
        variant: "destructive",
      });
    },
  });

  // Update doctor phone mutation
  const updateDoctorMutation = useMutation({
    mutationFn: async (phone: string) => {
      return apiRequest("PATCH", `/api/staff/${patient?.doctorId}`, { phone });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Doctor phone updated",
        description: "Doctor's phone number has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update doctor's phone.",
        variant: "destructive",
      });
    },
  });

  // Update nurse phone mutation
  const updateNurseMutation = useMutation({
    mutationFn: async (phone: string) => {
      return apiRequest("PATCH", `/api/staff/${patient?.nurseId}`, { phone });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/patients"] });
      toast({
        title: "Nurse phone updated",
        description: "Nurse's phone number has been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update nurse's phone.",
        variant: "destructive",
      });
    },
  });

  const validateIndianPhone = (phone: string): boolean => {
    return /^\+91[6-9]\d{9}$/.test(phone);
  };

  const handleSavePatient = async () => {
    if (!patient) return;

    // Validate phone numbers
    if (!validateIndianPhone(guardianPhone)) {
      toast({
        title: "Invalid guardian phone",
        description: "Please enter a valid Indian phone number (+91XXXXXXXXXX)",
        variant: "destructive",
      });
      return;
    }

    await updatePatientMutation.mutateAsync({
      name: patientName,
      roomNumber,
      floorNumber,
      blockNumber,
      guardianName,
      guardianPhone,
      thresholdMin: parseFloat(thresholdMin),
      thresholdMax: parseFloat(thresholdMax),
    });
  };

  const handleSaveDoctorPhone = async () => {
    if (!patient?.doctorId) return;
    if (!validateIndianPhone(doctorPhone)) {
      toast({
        title: "Invalid doctor phone",
        description: "Please enter a valid Indian phone number (+91XXXXXXXXXX)",
        variant: "destructive",
      });
      return;
    }
    await updateDoctorMutation.mutateAsync(doctorPhone);
  };

  const handleSaveNursePhone = async () => {
    if (!patient?.nurseId) return;
    if (!validateIndianPhone(nursePhone)) {
      toast({
        title: "Invalid nurse phone",
        description: "Please enter a valid Indian phone number (+91XXXXXXXXXX)",
        variant: "destructive",
      });
      return;
    }
    await updateNurseMutation.mutateAsync(nursePhone);
  };

  const isPending = updatePatientMutation.isPending || updateDoctorMutation.isPending || updateNurseMutation.isPending;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold" data-testid="text-settings-title">
          Settings
        </h1>
        <p className="text-muted-foreground">
          Manage patient details, phone numbers, and system preferences
        </p>
      </div>

      <div className="grid gap-6">
        {/* Patient Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <User className="h-5 w-5" />
              Patient Details
            </CardTitle>
            <CardDescription>
              Update patient information and location
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {patientsLoading ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="patientName">Patient Name</Label>
                    <Input
                      id="patientName"
                      value={patientName}
                      onChange={(e) => setPatientName(e.target.value)}
                      placeholder="Enter patient name"
                      data-testid="input-patient-name"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="guardianName">Guardian Name</Label>
                    <Input
                      id="guardianName"
                      value={guardianName}
                      onChange={(e) => setGuardianName(e.target.value)}
                      placeholder="Enter guardian name"
                      data-testid="input-guardian-name"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="roomNumber">Room</Label>
                    <Input
                      id="roomNumber"
                      value={roomNumber}
                      onChange={(e) => setRoomNumber(e.target.value)}
                      placeholder="101"
                      data-testid="input-room-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="floorNumber">Floor</Label>
                    <Input
                      id="floorNumber"
                      value={floorNumber}
                      onChange={(e) => setFloorNumber(e.target.value)}
                      placeholder="1"
                      data-testid="input-floor-number"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="blockNumber">Block</Label>
                    <Input
                      id="blockNumber"
                      value={blockNumber}
                      onChange={(e) => setBlockNumber(e.target.value)}
                      placeholder="A"
                      data-testid="input-block-number"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="thresholdMin">Min Threshold (°C)</Label>
                    <Input
                      id="thresholdMin"
                      type="number"
                      step="0.1"
                      value={thresholdMin}
                      onChange={(e) => setThresholdMin(e.target.value)}
                      data-testid="input-threshold-min"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="thresholdMax">Max Threshold (°C)</Label>
                    <Input
                      id="thresholdMax"
                      type="number"
                      step="0.1"
                      value={thresholdMax}
                      onChange={(e) => setThresholdMax(e.target.value)}
                      data-testid="input-threshold-max"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button
                    onClick={handleSavePatient}
                    disabled={updatePatientMutation.isPending}
                    data-testid="button-save-patient"
                  >
                    {updatePatientMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    <Save className="mr-2 h-4 w-4" />
                    Save Patient
                  </Button>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Phone Numbers for SMS Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Phone className="h-5 w-5" />
              SMS Alert Phone Numbers
            </CardTitle>
            <CardDescription>
              Indian phone numbers that will receive SMS alerts (+91XXXXXXXXXX)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Guardian Phone */}
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="guardianPhone" className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-500" />
                  Guardian Phone
                </Label>
                <Input
                  id="guardianPhone"
                  value={guardianPhone}
                  onChange={(e) => setGuardianPhone(e.target.value)}
                  placeholder="+919876543210"
                  data-testid="input-guardian-phone"
                />
              </div>
              <Button
                onClick={handleSavePatient}
                disabled={updatePatientMutation.isPending}
                size="sm"
                data-testid="button-save-guardian-phone"
              >
                {updatePatientMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>

            {/* Doctor Phone */}
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="doctorPhone" className="flex items-center gap-2">
                  <Stethoscope className="h-4 w-4 text-blue-500" />
                  Doctor Phone ({patient?.doctor?.name || "Not assigned"})
                </Label>
                <Input
                  id="doctorPhone"
                  value={doctorPhone}
                  onChange={(e) => setDoctorPhone(e.target.value)}
                  placeholder="+919876543211"
                  data-testid="input-doctor-phone"
                />
              </div>
              <Button
                onClick={handleSaveDoctorPhone}
                disabled={updateDoctorMutation.isPending || !patient?.doctorId}
                size="sm"
                data-testid="button-save-doctor-phone"
              >
                {updateDoctorMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>

            {/* Nurse Phone */}
            <div className="flex items-end gap-4">
              <div className="flex-1 space-y-2">
                <Label htmlFor="nursePhone" className="flex items-center gap-2">
                  <User className="h-4 w-4 text-green-500" />
                  Nurse Phone ({patient?.nurse?.name || "Not assigned"})
                </Label>
                <Input
                  id="nursePhone"
                  value={nursePhone}
                  onChange={(e) => setNursePhone(e.target.value)}
                  placeholder="+919876543212"
                  data-testid="input-nurse-phone"
                />
              </div>
              <Button
                onClick={handleSaveNursePhone}
                disabled={updateNurseMutation.isPending || !patient?.nurseId}
                size="sm"
                data-testid="button-save-nurse-phone"
              >
                {updateNurseMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              All phone numbers must be in Indian format: +91 followed by 10 digits starting with 6, 7, 8, or 9.
            </p>
          </CardContent>
        </Card>

        {/* Appearance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Appearance</CardTitle>
            <CardDescription>
              Customize how the application looks
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {theme === "light" ? (
                  <Sun className="h-5 w-5 text-amber-500" />
                ) : (
                  <Moon className="h-5 w-5 text-blue-400" />
                )}
                <div>
                  <Label className="text-base">Theme</Label>
                  <p className="text-sm text-muted-foreground">
                    Choose between light and dark mode
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={theme === "light" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("light")}
                  data-testid="button-theme-light"
                >
                  <Sun className="h-4 w-4 mr-1" />
                  Light
                </Button>
                <Button
                  variant={theme === "dark" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setTheme("dark")}
                  data-testid="button-theme-dark"
                >
                  <Moon className="h-4 w-4 mr-1" />
                  Dark
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* SMS Notifications Toggle */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notifications</CardTitle>
            <CardDescription>
              Configure alert and notification preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Bell className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label className="text-base">SMS Alerts</Label>
                  <p className="text-sm text-muted-foreground">
                    Send SMS notifications when temperature thresholds are exceeded
                  </p>
                </div>
              </div>
              <Switch
                checked={smsEnabled}
                onCheckedChange={setSmsEnabled}
                data-testid="switch-sms-alerts"
              />
            </div>
          </CardContent>
        </Card>

        {/* AI Thresholds Reference */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Thermometer className="h-5 w-5" />
              Temperature Threshold Reference
            </CardTitle>
            <CardDescription>
              Recommended temperature ranges based on patient condition
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Object.entries(diseaseThresholds).map(([disease, thresholds]) => (
                <div
                  key={disease}
                  className="flex items-center justify-between py-2 border-b last:border-0"
                >
                  <Badge variant="outline" className="font-normal">
                    {disease}
                  </Badge>
                  <span className="font-mono text-sm">
                    {thresholds.min}°C - {thresholds.max}°C
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Account Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Account Information</CardTitle>
            <CardDescription>
              Your profile and role information
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-muted-foreground">Name</Label>
                <p className="font-medium">{user?.name}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Email</Label>
                <p className="font-medium">{user?.email}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Phone</Label>
                <p className="font-medium">{user?.phone}</p>
              </div>
              <div>
                <Label className="text-muted-foreground">Role</Label>
                <Badge variant="default" className="capitalize mt-1">
                  {user?.role}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
