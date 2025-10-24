package BackEnd.dto;

import lombok.Data;
import java.util.List;

@Data
public class DietPlanRequest {
    private String title;
    private Long patientId;
    private Long dietitianId;
    private String description;
    private String status;
    private Integer dailyCalories;
    private Integer protein;
    private Integer carbs;
    private Integer fat;
    private List<MealRequest> meals;
    private String notes;

    @Data
    public static class MealRequest {
        private String mealType;
        private String description;
        private Integer calories;
    }
}
