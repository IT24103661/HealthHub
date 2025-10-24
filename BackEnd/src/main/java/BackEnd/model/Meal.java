package BackEnd.model;

import com.fasterxml.jackson.annotation.JsonBackReference;
import jakarta.persistence.*;

@Entity
@Table(name = "meals")
public class Meal {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "diet_plan_id", nullable = false)
    @JsonBackReference
    private DietPlan dietPlan;
    
    // Helper method to set the diet plan and update both sides of the relationship
    public void setDietPlan(DietPlan dietPlan) {
        if (this.dietPlan != null) {
            this.dietPlan.getMeals().remove(this);
        }
        this.dietPlan = dietPlan;
        if (dietPlan != null && !dietPlan.getMeals().contains(this)) {
            dietPlan.getMeals().add(this);
        }
    }

    @Column(name = "meal_type", nullable = false, length = 50)
    private String mealType;

    @Column(columnDefinition = "TEXT")
    private String description;

    private Integer calories;

    // Getters and Setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public DietPlan getDietPlan() {
        return dietPlan;
    }

    // The setter is now implemented above with proper relationship handling

    public String getMealType() {
        return mealType;
    }

    public void setMealType(String mealType) {
        this.mealType = mealType;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Integer getCalories() {
        return calories;
    }

    public void setCalories(Integer calories) {
        this.calories = calories;
    }
}
