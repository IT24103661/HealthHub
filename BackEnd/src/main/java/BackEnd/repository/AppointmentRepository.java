package BackEnd.repository;

import BackEnd.model.Appointment;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDateTime;
import java.util.List;

public interface AppointmentRepository extends JpaRepository<Appointment, Long> {
    List<Appointment> findByDoctorId(Long doctorId);
    List<Appointment> findByPatientId(Long patientId);
    List<Appointment> findByDoctorIdAndAppointmentDateBetween(
        Long doctorId, LocalDateTime start, LocalDateTime end);
    boolean existsByDoctorIdAndAppointmentDateBetween(
        Long doctorId, LocalDateTime start, LocalDateTime end);
}
