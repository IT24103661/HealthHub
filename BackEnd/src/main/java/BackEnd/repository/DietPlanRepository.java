package BackEnd.repository;

import BackEnd.model.DietPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface DietPlanRepository extends JpaRepository<DietPlan, Long> {
    List<DietPlan> findByPatientId(Long patientId);
    List<DietPlan> findByDietitianId(Long dietitianId);
    List<DietPlan> findByStatus(String status);
    
    @Query("SELECT dp FROM DietPlan dp " +
           "LEFT JOIN FETCH dp.patient " +
           "LEFT JOIN FETCH dp.dietitian " +
           "LEFT JOIN FETCH dp.meals " +
           "WHERE dp.id = :id")
    Optional<DietPlan> findByIdWithRelations(@Param("id") Long id);
}
