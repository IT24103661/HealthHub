package BackEnd.service;

import BackEnd.dto.DietPlanRequest;
import BackEnd.model.DietPlan;
import BackEnd.model.Meal;
import BackEnd.model.User;
import BackEnd.repository.DietPlanRepository;
import BackEnd.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class DietPlanService {

    private final DietPlanRepository dietPlanRepository;
    private final UserRepository userRepository;

    @Autowired
    public DietPlanService(DietPlanRepository dietPlanRepository, UserRepository userRepository) {
        this.dietPlanRepository = dietPlanRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public DietPlan createDietPlan(DietPlanRequest request) {
        // Find patient and dietitian
        User patient = userRepository.findById(request.getPatientId())
                .orElseThrow(() -> new EntityNotFoundException("Patient not found with id: " + request.getPatientId()));
        
        User dietitian = userRepository.findById(request.getDietitianId())
                .orElseThrow(() -> new EntityNotFoundException("Dietitian not found with id: " + request.getDietitianId()));

        // Create and save diet plan
        DietPlan dietPlan = new DietPlan();
        dietPlan.setTitle(request.getTitle());
        dietPlan.setPatient(patient);
        dietPlan.setDietitian(dietitian);
        dietPlan.setDescription(request.getDescription());
        dietPlan.setStatus(request.getStatus() != null ? request.getStatus() : "DRAFT");
        dietPlan.setDailyCalories(request.getDailyCalories());
        dietPlan.setProtein(request.getProtein());
        dietPlan.setCarbs(request.getCarbs());
        dietPlan.setFat(request.getFat());
        dietPlan.setNotes(request.getNotes());

        // Save diet plan first to get an ID
        DietPlan savedDietPlan = dietPlanRepository.save(dietPlan);

        // Add meals if present
        if (request.getMeals() != null && !request.getMeals().isEmpty()) {
            List<Meal> meals = request.getMeals().stream()
                    .map(mealRequest -> {
                        Meal meal = new Meal();
                        meal.setDietPlan(savedDietPlan);
                        meal.setMealType(mealRequest.getMealType());
                        meal.setDescription(mealRequest.getDescription());
                        meal.setCalories(mealRequest.getCalories());
                        return meal;
                    })
                    .collect(Collectors.toList());
            
            savedDietPlan.setMeals(meals);
            return dietPlanRepository.save(savedDietPlan);
        }

        return savedDietPlan;
    }

    public List<DietPlan> getDietPlansByPatientId(Long patientId) {
        return dietPlanRepository.findByPatientId(patientId);
    }

    public List<DietPlan> getDietPlansByDietitianId(Long dietitianId) {
        return dietPlanRepository.findByDietitianId(dietitianId);
    }

    public DietPlan getDietPlanById(Long id) {
        return dietPlanRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Diet plan not found with id: " + id));
    }

    @Transactional
    public void deleteDietPlan(Long id) {
        // Check if the diet plan exists
        if (!dietPlanRepository.existsById(id)) {
            throw new EntityNotFoundException("Diet plan not found with id: " + id);
        }
        // Delete the diet plan (cascading will handle related meals)
        dietPlanRepository.deleteById(id);
    }
    
    @Transactional
    public DietPlan updateDietPlan(Long id, DietPlanRequest request) {
        // Find existing diet plan with its relationships
        DietPlan existingPlan = dietPlanRepository.findByIdWithRelations(id)
            .orElseThrow(() -> new EntityNotFoundException("Diet plan not found with id: " + id));
        
        // Update basic fields
        existingPlan.setTitle(request.getTitle());
        existingPlan.setDescription(request.getDescription());
        existingPlan.setStatus(request.getStatus() != null ? request.getStatus() : existingPlan.getStatus());
        existingPlan.setDailyCalories(request.getDailyCalories());
        existingPlan.setProtein(request.getProtein());
        existingPlan.setCarbs(request.getCarbs());
        existingPlan.setFat(request.getFat());
        existingPlan.setNotes(request.getNotes());

        // Update patient and dietitian references if provided
        if (request.getPatientId() != null) {
            User patient = userRepository.findById(request.getPatientId())
                .orElseThrow(() -> new EntityNotFoundException("Patient not found with id: " + request.getPatientId()));
            existingPlan.setPatient(patient);
        }

        if (request.getDietitianId() != null) {
            User dietitian = userRepository.findById(request.getDietitianId())
                .orElseThrow(() -> new EntityNotFoundException("Dietitian not found with id: " + request.getDietitianId()));
            existingPlan.setDietitian(dietitian);
        }

        // Update meals if provided
        if (request.getMeals() != null) {
            // Clear existing meals
            existingPlan.getMeals().clear();
            
            // Add new meals
            for (DietPlanRequest.MealRequest mealRequest : request.getMeals()) {
                Meal meal = new Meal();
                meal.setMealType(mealRequest.getMealType());
                meal.setDescription(mealRequest.getDescription());
                meal.setCalories(mealRequest.getCalories());
                meal.setDietPlan(existingPlan);
                existingPlan.getMeals().add(meal);
            }
        }

        return dietPlanRepository.save(existingPlan);
    }
}
