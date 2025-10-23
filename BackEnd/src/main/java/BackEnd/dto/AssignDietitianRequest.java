package BackEnd.dto;

import jakarta.validation.constraints.NotNull;

public class AssignDietitianRequest {
    @NotNull(message = "Dietitian ID is required")
    private Long dietitianId;

    public AssignDietitianRequest() {
    }

    public AssignDietitianRequest(Long dietitianId) {
        this.dietitianId = dietitianId;
    }

    public Long getDietitianId() {
        return dietitianId;
    }

    public void setDietitianId(Long dietitianId) {
        this.dietitianId = dietitianId;
    }
}
