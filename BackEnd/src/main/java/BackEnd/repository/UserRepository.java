package BackEnd.repository;

import BackEnd.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    
    Optional<User> findByEmail(String email);
    
    boolean existsByEmail(String email);
    
    Optional<User> findByEmailAndPassword(String email, String password);
    
    Optional<User> findByIdAndRole(Long id, String role);
    
    List<User> findByRole(String role);
    
    List<User> findByAssignedDietitianId(Long dietitianId);
}
