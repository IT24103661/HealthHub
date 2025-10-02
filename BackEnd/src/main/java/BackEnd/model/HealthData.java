package BackEnd.model;

import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.validation.constraints.NotNull;

@Entity
public class HealthData {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @NotNull(message = "User ID is required")
    private Long userId;

    private Integer age;
    private Double weight;
    private Double height;
    private Double bmi;
    private String activityLevel;
    private String allergies;
    private String medicalHistory;
    private String dietaryPreferences;
    private String healthGoal;

    public HealthData() {}

    public HealthData(Long userId, Integer age, Double weight, Double height, String activityLevel, String allergies, String medicalHistory, String dietaryPreferences, String healthGoal) {
        this.userId = userId;
        this.age = age;
        this.weight = weight;
        this.height = height;
        this.activityLevel = activityLevel;
        this.allergies = allergies;
        this.medicalHistory = medicalHistory;
        this.dietaryPreferences = dietaryPreferences;
        this.healthGoal = healthGoal;
        calculateBMI();
    }

    private void calculateBMI() {
        if (weight != null && height != null && height > 0) {
            double heightInMeters = height / 100.0;
            this.bmi = weight / (heightInMeters * heightInMeters);
            this.bmi = Math.round(this.bmi * 10.0) / 10.0;
        }
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Long getUserId() { return userId; }
    public void setUserId(Long userId) { this.userId = userId; }

    public Integer getAge() { return age; }
    public void setAge(Integer age) { this.age = age; }

    public Double getWeight() { return weight; }
    public void setWeight(Double weight) { 
        this.weight = weight;
        calculateBMI();
    }

    public Double getHeight() { return height; }
    public void setHeight(Double height) { 
        this.height = height;
        calculateBMI();
    }

    public Double getBmi() { return bmi; }
    public void setBmi(Double bmi) { this.bmi = bmi; }

    public String getActivityLevel() { return activityLevel; }
    public void setActivityLevel(String activityLevel) { this.activityLevel = activityLevel; }

    public String getAllergies() { return allergies; }
    public void setAllergies(String allergies) { this.allergies = allergies; }

    public String getMedicalHistory() { return medicalHistory; }
    public void setMedicalHistory(String medicalHistory) { this.medicalHistory = medicalHistory; }

    public String getDietaryPreferences() { return dietaryPreferences; }
    public void setDietaryPreferences(String dietaryPreferences) { this.dietaryPreferences = dietaryPreferences; }

    public String getHealthGoal() { return healthGoal; }
    public void setHealthGoal(String healthGoal) { this.healthGoal = healthGoal; }
}
