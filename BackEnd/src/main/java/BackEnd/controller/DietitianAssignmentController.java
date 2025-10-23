package BackEnd.controller;

import BackEnd.dto.AssignDietitianRequest;
import BackEnd.model.User;
import BackEnd.service.DietitianAssignmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class DietitianAssignmentController {

    private final DietitianAssignmentService dietitianAssignmentService;

    @PostMapping("/{patientId}/assign-dietitian")
    public ResponseEntity<?> assignDietitian(
            @PathVariable Long patientId,
            @Valid @RequestBody AssignDietitianRequest request) {
        try {
            dietitianAssignmentService.assignDietitian(patientId, request);
            return ResponseEntity.ok().build();
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(e.getMessage());
        }
    }

    @GetMapping("/dietitians")
    public ResponseEntity<List<User>> getAllDietitians() {
        List<User> dietitians = dietitianAssignmentService.getAllDietitians();
        return ResponseEntity.ok(dietitians);
    }

    @GetMapping("/dietitians/{dietitianId}/patients")
    public ResponseEntity<List<User>> getPatientsByDietitianId(@PathVariable Long dietitianId) {
        List<User> patients = dietitianAssignmentService.getPatientsByDietitianId(dietitianId);
        return ResponseEntity.ok(patients);
    }
}
