package BackEnd.controller;

import BackEnd.dto.DietPlanRequest;
import BackEnd.model.DietPlan;
import BackEnd.service.DietPlanService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/diet-plans")
@CrossOrigin(origins = "http://localhost:3000", allowCredentials = "true", 
    allowedHeaders = "*", 
    methods = {RequestMethod.GET, RequestMethod.POST, RequestMethod.PUT, RequestMethod.DELETE, RequestMethod.OPTIONS})
public class DietPlanController {

    private final DietPlanService dietPlanService;

    @Autowired
    public DietPlanController(DietPlanService dietPlanService) {
        this.dietPlanService = dietPlanService;
    }

    @PostMapping
    public ResponseEntity<?> createDietPlan(@RequestBody DietPlanRequest request) {
        try {
            DietPlan dietPlan = dietPlanService.createDietPlan(request);
            return ResponseEntity.ok(createSuccessResponse(dietPlan));
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @GetMapping("/patient/{patientId}")
    public ResponseEntity<?> getDietPlansByPatientId(@PathVariable Long patientId) {
        try {
            List<DietPlan> dietPlans = dietPlanService.getDietPlansByPatientId(patientId);
            return ResponseEntity.ok(createSuccessResponse(dietPlans));
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @GetMapping("/dietitian/{dietitianId}")
    public ResponseEntity<?> getDietPlansByDietitianId(@PathVariable Long dietitianId) {
        try {
            List<DietPlan> dietPlans = dietPlanService.getDietPlansByDietitianId(dietitianId);
            return ResponseEntity.ok(createSuccessResponse(dietPlans));
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getDietPlanById(@PathVariable Long id) {
        try {
            DietPlan dietPlan = dietPlanService.getDietPlanById(id);
            return ResponseEntity.ok(createSuccessResponse(dietPlan));
        } catch (Exception e) {
            return handleException(e);
        }
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateDietPlan(@PathVariable Long id, @RequestBody DietPlanRequest request) {
        try {
            // Log the incoming request for debugging
            System.out.println("Updating diet plan with ID: " + id);
            System.out.println("Request data: " + request);
            
            // Validate required fields
            if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
                throw new IllegalArgumentException("Title is required");
            }
            
            if (request.getPatientId() == null) {
                throw new IllegalArgumentException("Patient ID is required");
            }
            
            if (request.getDietitianId() == null) {
                throw new IllegalArgumentException("Dietitian ID is required");
            }
            
            // Log before calling service
            System.out.println("Calling updateDietPlan service method...");
            DietPlan updatedPlan = dietPlanService.updateDietPlan(id, request);
            System.out.println("Successfully updated diet plan with ID: " + updatedPlan.getId());
            
            return ResponseEntity.ok(createSuccessResponse(updatedPlan));
        } catch (Exception e) {
            // Log the full stack trace for debugging
            System.err.println("Error updating diet plan with ID " + id + ":");
            e.printStackTrace();
            return handleException(e);
        }
    }
    
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteDietPlan(@PathVariable Long id) {
        try {
            System.out.println("Deleting diet plan with ID: " + id);
            dietPlanService.deleteDietPlan(id);
            System.out.println("Successfully deleted diet plan with ID: " + id);
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("message", "Diet plan deleted successfully");
            response.put("deletedId", id);
            
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            System.err.println("Error deleting diet plan with ID " + id + ":");
            e.printStackTrace();
            return handleException(e);
        }
    }

    private Map<String, Object> createSuccessResponse(Object data) {
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("data", data);
        return response;
    }

    private ResponseEntity<Map<String, Object>> handleException(Exception e) {
        Map<String, Object> errorResponse = new HashMap<>();
        errorResponse.put("success", false);
        
        // Handle different types of exceptions with appropriate status codes
        if (e instanceof IllegalArgumentException) {
            errorResponse.put("status", 400);
            errorResponse.put("error", "Bad Request");
        } else if (e instanceof jakarta.persistence.EntityNotFoundException) {
            errorResponse.put("status", 404);
            errorResponse.put("error", "Not Found");
        } else if (e instanceof org.springframework.dao.DataIntegrityViolationException) {
            errorResponse.put("status", 409);
            errorResponse.put("error", "Conflict - Data integrity violation");
        } else {
            errorResponse.put("status", 500);
            errorResponse.put("error", "Internal Server Error");
        }
        
        errorResponse.put("message", e.getMessage());
        errorResponse.put("errorType", e.getClass().getName());
        
        // Add more debug information
        if (e.getCause() != null) {
            errorResponse.put("cause", e.getCause().getMessage());
            errorResponse.put("causeType", e.getCause().getClass().getName());
        }
        
        // Log the full stack trace for debugging
        e.printStackTrace();
        
        return ResponseEntity.status(500).body(errorResponse);
    }
}
