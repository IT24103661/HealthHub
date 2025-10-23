package BackEnd.repository;

import BackEnd.model.User;
import BackEnd.model.prescription.Prescription;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface PrescriptionRepository extends JpaRepository<Prescription, Long> {
    List<Prescription> findByPatientId(Long patientId);
    List<Prescription> findByDoctorId(Long doctorId);
    
    @Query(value = "SELECT DISTINCT u.* FROM users u " +
            "INNER JOIN prescriptions p ON u.id = p.patient_id", 
           nativeQuery = true)
    List<User> findDistinctPatients();
    
    @Query("SELECT p FROM Prescription p WHERE p.patient = :patient ORDER BY p.prescriptionDate DESC")
    List<Prescription> findByPatient(@Param("patient") User patient);
    
    @Query("SELECT p FROM Prescription p WHERE p.patient = :patient ORDER BY p.prescriptionDate DESC LIMIT 1")
    Optional<Prescription> findTopByPatientOrderByPrescriptionDateDesc(@Param("patient") User patient);
}
