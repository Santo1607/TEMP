import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { insertPatientSchema, diseaseTypes, type Patient, type Staff } from "@shared/schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2 } from "lucide-react";

const patientFormSchema = insertPatientSchema.extend({
  name: z.string().min(2, "Name must be at least 2 characters"),
  roomNumber: z.string().min(1, "Room number is required"),
  floorNumber: z.string().min(1, "Floor number is required"),
  blockNumber: z.string().min(1, "Block number is required"),
  disease: z.string().min(1, "Disease is required"),
  guardianName: z.string().min(2, "Guardian name is required"),
  guardianPhone: z.string().min(10, "Valid phone number is required"),
  thresholdMin: z.coerce.number().min(30).max(40),
  thresholdMax: z.coerce.number().min(35).max(45),
});

type PatientFormValues = z.infer<typeof patientFormSchema>;

interface PatientFormProps {
  patient?: Patient;
  doctors: Staff[];
  nurses: Staff[];
  onSubmit: (data: PatientFormValues) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
}

export function PatientForm({
  patient,
  doctors,
  nurses,
  onSubmit,
  onCancel,
  isLoading,
}: PatientFormProps) {
  const form = useForm<PatientFormValues>({
    resolver: zodResolver(patientFormSchema),
    defaultValues: {
      name: patient?.name ?? "",
      roomNumber: patient?.roomNumber ?? "",
      floorNumber: patient?.floorNumber ?? "",
      blockNumber: patient?.blockNumber ?? "",
      disease: patient?.disease ?? "",
      guardianName: patient?.guardianName ?? "",
      guardianPhone: patient?.guardianPhone ?? "",
      doctorId: patient?.doctorId ?? undefined,
      nurseId: patient?.nurseId ?? undefined,
      thresholdMin: patient?.thresholdMin ?? 36.5,
      thresholdMax: patient?.thresholdMax ?? 37.5,
    },
  });

  const handleSubmit = async (data: PatientFormValues) => {
    await onSubmit(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Patient Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="John Doe"
                    {...field}
                    data-testid="input-patient-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="disease"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Disease/Condition</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger data-testid="select-disease">
                      <SelectValue placeholder="Select condition" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {diseaseTypes.map((disease) => (
                      <SelectItem key={disease} value={disease}>
                        {disease}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="roomNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Room Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="101"
                    {...field}
                    data-testid="input-room-number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="floorNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Floor Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="1"
                    {...field}
                    data-testid="input-floor-number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="blockNumber"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Block Number</FormLabel>
                <FormControl>
                  <Input
                    placeholder="A"
                    {...field}
                    data-testid="input-block-number"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="guardianName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Guardian Name</FormLabel>
                <FormControl>
                  <Input
                    placeholder="Jane Doe"
                    {...field}
                    data-testid="input-guardian-name"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="guardianPhone"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Guardian Phone</FormLabel>
                <FormControl>
                  <Input
                    placeholder="+1234567890"
                    {...field}
                    data-testid="input-guardian-phone"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="doctorId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned Doctor</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value ?? undefined}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-doctor">
                      <SelectValue placeholder="Select doctor" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {doctors.map((doctor) => (
                      <SelectItem key={doctor.id} value={doctor.id}>
                        {doctor.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="nurseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Assigned Nurse</FormLabel>
                <Select
                  onValueChange={field.onChange}
                  defaultValue={field.value ?? undefined}
                >
                  <FormControl>
                    <SelectTrigger data-testid="select-nurse">
                      <SelectValue placeholder="Select nurse" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {nurses.map((nurse) => (
                      <SelectItem key={nurse.id} value={nurse.id}>
                        {nurse.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="border-t pt-6">
          <h4 className="text-sm font-medium mb-4">Temperature Thresholds (AI Suggested)</h4>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="thresholdMin"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Minimum (°C)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      {...field}
                      data-testid="input-threshold-min"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="thresholdMax"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Maximum (°C)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      step="0.1"
                      {...field}
                      data-testid="input-threshold-max"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            data-testid="button-cancel"
          >
            Cancel
          </Button>
          <Button type="submit" disabled={isLoading} data-testid="button-submit">
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {patient ? "Update Patient" : "Add Patient"}
          </Button>
        </div>
      </form>
    </Form>
  );
}
