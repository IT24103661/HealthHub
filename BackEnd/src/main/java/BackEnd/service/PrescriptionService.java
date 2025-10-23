package BackEnd.service;

import BackEnd.dto.PrescriptionRequest;
import BackEnd.dto.PrescriptionResponse;
import BackEnd.exception.ResourceNotFoundException;
import BackEnd.model.User;
import BackEnd.model.prescription.Prescription;
import BackEnd.model.prescription.PrescriptionMedication;
import BackEnd.repository.PrescriptionRepository;
import BackEnd.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
public class PrescriptionService {

    private final PrescriptionRepository prescriptionRepository;
    private final UserRepository userRepository;

    @Autowired
    public PrescriptionService(PrescriptionRepository prescriptionRepository, 
                             UserRepository userRepository) {
        this.prescriptionRepository = prescriptionRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public PrescriptionResponse createPrescription(PrescriptionRequest request, Long doctorId) {
        // Find patient and doctor
        User patient = userRepository.findById(request.getPatientId())
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + request.getPatientId()));
        
        User doctor = userRepository.findById(doctorId)
            .orElseThrow(() -> new ResourceNotFoundException("Doctor not found with id: " + doctorId));
        
        // Create new prescription
        Prescription prescription = new Prescription();
        prescription.setPatient(patient);
        prescription.setDoctor(doctor);
        prescription.setDiagnosis(request.getDiagnosis());
        prescription.setNotes(request.getNotes());
        prescription.setValidUntil(request.getValidUntil());
        
        // Add medications
        if (request.getMedications() != null) {
            for (PrescriptionRequest.MedicationDto medDto : request.getMedications()) {
                PrescriptionMedication medication = new PrescriptionMedication();
                medication.setName(medDto.getName());
                medication.setDosage(medDto.getDosage());
                medication.setFrequency(medDto.getFrequency());
                medication.setDuration(medDto.getDuration());
                medication.setInstructions(medDto.getInstructions());
                prescription.addMedication(medication);
            }
        }
        
        // Save prescription
        Prescription savedPrescription = prescriptionRepository.save(prescription);
        
        // Convert to response DTO
        return convertToResponse(savedPrescription);
    }
    
    public List<PrescriptionResponse> getPatientPrescriptions(Long patientId) {
        return prescriptionRepository.findByPatientId(patientId).stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    public List<PrescriptionResponse> getDoctorPrescriptions(Long doctorId) {
        return prescriptionRepository.findByDoctorId(doctorId).stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    public List<PrescriptionResponse> getAllPrescriptions() {
        return prescriptionRepository.findAll().stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    public PrescriptionResponse getPrescriptionById(Long id) {
        Prescription prescription = prescriptionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));
        return convertToResponse(prescription);
    }
    
    private PrescriptionResponse convertToResponse(Prescription prescription) {
        PrescriptionResponse response = new PrescriptionResponse();
        response.setId(prescription.getId());
        response.setPatientId(prescription.getPatient().getId());
        response.setDoctorId(prescription.getDoctor().getId());
        response.setDiagnosis(prescription.getDiagnosis());
        response.setNotes(prescription.getNotes());
        response.setValidUntil(prescription.getValidUntil());
        response.setPrescriptionDate(prescription.getPrescriptionDate());
        response.setStatus(prescription.getStatus());
        
        // Set patient name if available
        if (prescription.getPatient() != null) {
            response.setPatientName(prescription.getPatient().getFullName());
        }
        
        // Set doctor name if available
        if (prescription.getDoctor() != null) {
            response.setDoctorName("Dr. " + prescription.getDoctor().getFullName());
        }
        
        // Convert medications if available
        if (prescription.getMedications() != null) {
            List<PrescriptionResponse.MedicationResponse> medicationResponses = prescription.getMedications().stream()
                .map(med -> {
                    PrescriptionResponse.MedicationResponse medResponse = new PrescriptionResponse.MedicationResponse();
                    medResponse.setId(med.getId());
                    medResponse.setName(med.getName());
                    medResponse.setDosage(med.getDosage());
                    medResponse.setFrequency(med.getFrequency());
                    medResponse.setInstructions(med.getInstructions());
                    return medResponse;
                })
                .collect(Collectors.toList());
            response.setMedications(medicationResponses);
        }
        
        return response;
    }
}
