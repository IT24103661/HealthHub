package BackEnd.repository;

import BackEnd.model.InventryModel;
import org.springframework.data.jpa.repository.JpaRepository;

public interface InventryRepository extends JpaRepository<InventryModel, Long> {}