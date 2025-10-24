package BackEnd.controller;

import BackEnd.exception.InventryNotFoundException;
import BackEnd.model.HealthData;
import BackEnd.repository.HealthDataRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/healthdata")
public class HealthDataController {

    @Autowired
    private HealthDataRepository healthDataRepository;

    @PostMapping
    public HealthData createHealthData(@Valid @RequestBody HealthData newHealthData) {
        return healthDataRepository.save(newHealthData);
    }

    @GetMapping
    public List<HealthData> getAllHealthData() {
        return healthDataRepository.findAll();
    }

    @GetMapping("/{id}")
    public HealthData getHealthDataById(@PathVariable Long id) {
        return healthDataRepository.findById(id)
                .orElseThrow(() -> new InventryNotFoundException(id));
    }
    
    @GetMapping("/user/{userId}")
    public List<HealthData> getHealthDataByUserId(@PathVariable Long userId) {
        return healthDataRepository.findByUserId(userId);
    }

    @PutMapping("/{id}")
    public HealthData updateHealthData(@PathVariable Long id, @Valid @RequestBody HealthData updatedHealthData) {
        return healthDataRepository.findById(id)
                .map(healthData -> {
                    healthData.setUserId(updatedHealthData.getUserId());
                    healthData.setAge(updatedHealthData.getAge());
                    healthData.setWeight(updatedHealthData.getWeight());
                    healthData.setHeight(updatedHealthData.getHeight());
                    healthData.setActivityLevel(updatedHealthData.getActivityLevel());
                    healthData.setAllergies(updatedHealthData.getAllergies());
                    healthData.setMedicalHistory(updatedHealthData.getMedicalHistory());
                    healthData.setDietaryPreferences(updatedHealthData.getDietaryPreferences());
                    healthData.setHealthGoal(updatedHealthData.getHealthGoal());
                    return healthDataRepository.save(healthData);
                })
                .orElseThrow(() -> new InventryNotFoundException(id));
    }

    @DeleteMapping("/{id}")
    public String deleteHealthData(@PathVariable Long id) {
        if (!healthDataRepository.existsById(id)) {
            throw new InventryNotFoundException(id);
        }
        healthDataRepository.deleteById(id);
        return "Health data with id " + id + " has been deleted successfully";
    }
}
