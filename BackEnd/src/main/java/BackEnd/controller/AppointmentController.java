package BackEnd.controller;

import BackEnd.model.Appointment;
import BackEnd.service.AppointmentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/appointments")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true")
public class AppointmentController {

    @Autowired
    private AppointmentService appointmentService;

    @GetMapping
    public ResponseEntity<?> getAllAppointments() {
        try {
            List<Appointment> appointments = appointmentService.getAllAppointments();
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("appointments", appointments);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to fetch appointments: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @PostMapping(consumes = {"application/json"})
    public ResponseEntity<?> scheduleAppointment(@RequestBody Map<String, Object> requestBody) {
        try {
            System.out.println("Received request: " + requestBody);
            
            // Extract and validate patientId
            Long patientId = null;
            if (requestBody.get("patientId") != null) {
                try {
                    patientId = ((Number)requestBody.get("patientId")).longValue();
                } catch (Exception e) {
                    throw new IllegalArgumentException("Invalid patientId format. Must be a number.");
                }
            }
            
            // Extract and validate doctorId
            Long doctorId = null;
            if (requestBody.get("doctorId") != null) {
                try {
                    Object doctorIdObj = requestBody.get("doctorId");
                    if (doctorIdObj instanceof Number) {
                        doctorId = ((Number)doctorIdObj).longValue();
                    } else if (doctorIdObj instanceof String) {
                        doctorId = Long.parseLong((String)doctorIdObj);
                    } else {
                        throw new IllegalArgumentException("Invalid doctorId format");
                    }
                } catch (Exception e) {
                    throw new IllegalArgumentException("Invalid doctorId format. Must be a number.");
                }
            }
            
            String type = (String) requestBody.get("type");
            String notes = (String) requestBody.get("notes");
            
            // Parse the date string from the request
            LocalDateTime appointmentDate = null;
            if (requestBody.get("appointmentDate") != null) {
                try {
                    String dateStr = requestBody.get("appointmentDate").toString();
                    // Handle both with and without timezone offset
                    if (dateStr.endsWith("Z")) {
                        appointmentDate = LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
                    } else {
                        appointmentDate = LocalDateTime.parse(dateStr);
                    }
                } catch (Exception e) {
                    throw new IllegalArgumentException("Invalid appointmentDate format. Expected ISO-8601 format.");
                }
            }
            
            // Validate required fields
            if (patientId == null) {
                throw new IllegalArgumentException("Patient ID is required");
            }
            if (doctorId == null) {
                throw new IllegalArgumentException("Doctor ID is required");
            }
            if (appointmentDate == null) {
                throw new IllegalArgumentException("Appointment date is required");
            }
            if (type == null || type.trim().isEmpty()) {
                throw new IllegalArgumentException("Appointment type is required");
            }
            
            Appointment appointment = appointmentService.scheduleAppointment(
                patientId, doctorId, appointmentDate, type, notes);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("appointment", appointment);
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            errorResponse.put("error", e.getClass().getSimpleName());
            
            if (e.getCause() != null) {
                errorResponse.put("cause", e.getCause().getMessage());
            }
            
            return ResponseEntity.badRequest().body(errorResponse);
        }
    }

    @GetMapping("/doctor/{doctorId}")
    public ResponseEntity<?> getDoctorAppointments(@PathVariable Long doctorId) {
        try {
            List<Appointment> appointments = appointmentService.getDoctorAppointments(doctorId);
            
            // Convert to DTOs with patient details
            List<Map<String, Object>> response = appointments.stream().map(appointment -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", appointment.getId());
                dto.put("appointmentDate", appointment.getAppointmentDate());
                dto.put("type", appointment.getType());
                dto.put("status", appointment.getStatus());
                dto.put("notes", appointment.getNotes());
                dto.put("duration", 30); // Default duration
                dto.put("location", "Main Clinic"); // Default location
                
                // Add patient details
                if (appointment.getPatient() != null) {
                    Map<String, Object> patient = new HashMap<>();
                    patient.put("id", appointment.getPatient().getId());
                    String[] nameParts = appointment.getPatient().getFullName().split(" ", 2);
                    patient.put("firstName", nameParts[0]);
                    patient.put("lastName", nameParts.length > 1 ? nameParts[1] : "");
                    patient.put("email", appointment.getPatient().getEmail());
                    dto.put("patient", patient);
                }
                
                // Add doctor details
                if (appointment.getDoctor() != null) {
                    Map<String, Object> doctor = new HashMap<>();
                    doctor.put("id", appointment.getDoctor().getId());
                    doctor.put("name", appointment.getDoctor().getFullName());
                    dto.put("doctor", doctor);
                }
                
                return dto;
            }).collect(Collectors.toList());
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.status(500).body("Error fetching doctor appointments: " + e.getMessage());
        }
    }
    
    @PutMapping("/{id}")
    public ResponseEntity<?> updateAppointment(
            @PathVariable Long id,
            @RequestBody Map<String, Object> updates) {
        try {
            // Remove patientId from updates to prevent changing the patient
            updates.remove("patientId");
            
            // Parse date if it exists
            if (updates.containsKey("appointmentDate")) {
                String dateStr = updates.get("appointmentDate").toString();
                try {
                    // Handle both with and without timezone offset
                    LocalDateTime appointmentDate;
                    if (dateStr.endsWith("Z")) {
                        appointmentDate = LocalDateTime.parse(dateStr, DateTimeFormatter.ISO_OFFSET_DATE_TIME);
                    } else {
                        appointmentDate = LocalDateTime.parse(dateStr);
                    }
                    updates.put("appointmentDate", appointmentDate);
                } catch (Exception e) {
                    throw new IllegalArgumentException("Invalid appointmentDate format. Expected ISO-8601 format.");
                }
            }
            
            Appointment updatedAppointment = appointmentService.updateAppointment(id, updates);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Appointment updated successfully");
            response.put("appointment", updatedAppointment);
            
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", e.getMessage());
            return ResponseEntity.badRequest().body(errorResponse);
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to update appointment: " + e.getMessage());
            return ResponseEntity.status(500).body(errorResponse);
        }
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<?> getPatientAppointments(@PathVariable Long patientId) {
        try {
            List<Appointment> appointments = appointmentService.getPatientAppointments(patientId);
            return ResponseEntity.ok(Map.of("success", true, "appointments", appointments));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                Map.of("success", false, "message", e.getMessage())
            );
        }
    }

    @GetMapping("/doctor/{doctorId}/schedule")
    public ResponseEntity<?> getDoctorSchedule(
            @PathVariable Long doctorId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) LocalDateTime end) {
        
        try {
            List<Appointment> schedule = appointmentService.getDoctorSchedule(doctorId, start, end);
            return ResponseEntity.ok(Map.of("success", true, "schedule", schedule));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                Map.of("success", false, "message", e.getMessage())
            );
        }
    }
    
    @DeleteMapping("/{id}")
    @CrossOrigin(origins = "http://localhost:3000", methods = {RequestMethod.DELETE, RequestMethod.OPTIONS})
    public ResponseEntity<?> deleteAppointment(@PathVariable("id") Long id) {
        try {
            appointmentService.deleteAppointment(id);
            return ResponseEntity.ok(Map.of(
                "success", true,
                "message", "Appointment deleted successfully"
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(
                Map.of("success", false, "message", e.getMessage())
            );
        }
    }
}
