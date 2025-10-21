package BackEnd.service;

import BackEnd.model.Appointment;
import BackEnd.model.User;
import BackEnd.repository.AppointmentRepository;
import BackEnd.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Service
@Transactional
public class AppointmentService {

    @Autowired
    private AppointmentRepository appointmentRepository;

    @Autowired
    private UserRepository userRepository;
    
    public List<Appointment> getAllAppointments() {
        return appointmentRepository.findAll();
    }

    public Appointment scheduleAppointment(Long patientId, Long doctorId, LocalDateTime appointmentDate, 
                                         String type, String notes) {
        // Validate users exist
        User patient = userRepository.findById(patientId)
            .orElseThrow(() -> new RuntimeException("Patient not found"));
        
        User doctor = userRepository.findById(doctorId)
            .orElseThrow(() -> new RuntimeException("Doctor not found"));

        // Check for time slot availability (30-minute buffer)
        LocalDateTime startTime = appointmentDate.minusMinutes(30);
        LocalDateTime endTime = appointmentDate.plusMinutes(30);
        
        if (appointmentRepository.existsByDoctorIdAndAppointmentDateBetween(
                doctorId, startTime, endTime)) {
            throw new RuntimeException("Doctor already has an appointment during this time");
        }

        // Create and save the appointment
        Appointment appointment = new Appointment();
        appointment.setPatient(patient);
        appointment.setDoctor(doctor);
        appointment.setAppointmentDate(appointmentDate);
        appointment.setType(type);
        appointment.setNotes(notes);
        appointment.setStatus("scheduled");

        return appointmentRepository.save(appointment);
    }

    public List<Appointment> getDoctorAppointments(Long doctorId) {
        return appointmentRepository.findByDoctorId(doctorId);
    }

    public List<Appointment> getPatientAppointments(Long patientId) {
        return appointmentRepository.findByPatientId(patientId);
    }

    public List<Appointment> getDoctorSchedule(Long doctorId, LocalDateTime start, LocalDateTime end) {
        return appointmentRepository.findByDoctorIdAndAppointmentDateBetween(doctorId, start, end);
    }
    
    @Transactional
    public void deleteAppointment(Long id) {
        if (!appointmentRepository.existsById(id)) {
            throw new RuntimeException("Appointment not found with id: " + id);
        }
        appointmentRepository.deleteById(id);
    }
    
    public Appointment updateAppointment(Long id, Map<String, Object> updates) {
        Appointment appointment = appointmentRepository.findById(id)
            .orElseThrow(() -> new RuntimeException("Appointment not found with id: " + id));
            
        // Update doctor if provided
        if (updates.containsKey("doctorId")) {
            Long doctorId = ((Number)updates.get("doctorId")).longValue();
            User doctor = userRepository.findById(doctorId)
                .orElseThrow(() -> new RuntimeException("Doctor not found with id: " + doctorId));
            appointment.setDoctor(doctor);
        }
        
        // Update appointment date if provided
        if (updates.containsKey("appointmentDate")) {
            LocalDateTime appointmentDate = LocalDateTime.parse(updates.get("appointmentDate").toString());
            appointment.setAppointmentDate(appointmentDate);
        }
        
        // Update type if provided
        if (updates.containsKey("type")) {
            appointment.setType(updates.get("type").toString());
        }
        
        // Update notes if provided
        if (updates.containsKey("notes")) {
            appointment.setNotes(updates.get("notes").toString());
        }
        
        // Update status if provided
        if (updates.containsKey("status")) {
            appointment.setStatus(updates.get("status").toString());
        }
        
        return appointmentRepository.save(appointment);
    }
}
