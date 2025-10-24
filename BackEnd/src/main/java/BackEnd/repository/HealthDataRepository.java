package BackEnd.repository;

import BackEnd.model.HealthData;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface HealthDataRepository extends JpaRepository<HealthData, Long> {
    List<HealthData> findByUserId(Long userId);
}
