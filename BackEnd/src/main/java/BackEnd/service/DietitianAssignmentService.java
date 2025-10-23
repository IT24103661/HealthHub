package BackEnd.service;

import BackEnd.dto.AssignDietitianRequest;
import BackEnd.model.User;
import BackEnd.repository.UserRepository;
import jakarta.persistence.EntityNotFoundException;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DietitianAssignmentService {
    private final UserRepository userRepository;

    @Transactional
    public void assignDietitian(Long patientId, AssignDietitianRequest request) {
        // Find the patient
        User patient = userRepository.findById(patientId)
                .orElseThrow(() -> new EntityNotFoundException("Patient not found with id: " + patientId));

        // Verify the patient has a valid role (case-insensitive check)
        String userRole = patient.getRole();
        if (userRole == null || !(userRole.equalsIgnoreCase("PATIENT") || userRole.equalsIgnoreCase("user"))) {
            throw new IllegalArgumentException("User with id " + patientId + " is not a patient");
        }

        // Find the dietitian
        User dietitian = userRepository.findByIdAndRole(request.getDietitianId(), "dietitian")
                .orElseThrow(() -> new EntityNotFoundException("Dietitian not found with id: " + request.getDietitianId()));

        // Assign the dietitian to the patient
        patient.setAssignedDietitian(dietitian);
        userRepository.save(patient);
    }

    public List<User> getAllDietitians() {
        return userRepository.findByRole("dietitian");
    }

    public List<User> getPatientsByDietitianId(Long dietitianId) {
        return userRepository.findByAssignedDietitianId(dietitianId);
    }
}
