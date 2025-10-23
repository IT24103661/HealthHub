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

import java.util.*;
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
        User patient = userRepository.findById(patientId)
            .orElseThrow(() -> new ResourceNotFoundException("Patient not found with id: " + patientId));
            
        return prescriptionRepository.findByPatient(patient).stream()
            .map(this::convertToResponse)
            .collect(Collectors.toList());
    }
    
    @Transactional
    public PrescriptionResponse updatePrescription(Long id, PrescriptionRequest request) {
        // Find the existing prescription with its medications
        Prescription prescription = prescriptionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));
        
        // Update basic prescription fields
        if (request.getDiagnosis() != null) {
            prescription.setDiagnosis(request.getDiagnosis());
        }
        
        if (request.getNotes() != null) {
            prescription.setNotes(request.getNotes());
        }
        
        if (request.getValidUntil() != null) {
            prescription.setValidUntil(request.getValidUntil());
        }
        
        // Handle medications update
        if (request.getMedications() != null && !request.getMedications().isEmpty()) {
            // Create a map of existing medications by ID for quick lookup
            Map<Long, PrescriptionMedication> existingMeds = prescription.getMedications().stream()
                .collect(Collectors.toMap(PrescriptionMedication::getId, med -> med));
            
            // Clear the existing medications collection
            prescription.getMedications().clear();
            
            // Process each medication from the request
            for (PrescriptionRequest.MedicationDto medDto : request.getMedications()) {
                PrescriptionMedication medication;
                
                // If the medication has an ID, it's an existing one that needs to be updated
                if (medDto.getId() != null && existingMeds.containsKey(medDto.getId())) {
                    medication = existingMeds.get(medDto.getId());
                } else {
                    // It's a new medication
                    medication = new PrescriptionMedication();
                    medication.setPrescription(prescription);
                }
                
                // Update medication details
                medication.setName(medDto.getName());
                medication.setDosage(medDto.getDosage());
                medication.setFrequency(medDto.getFrequency());
                medication.setInstructions(medDto.getInstructions());
                
                // Add to the prescription's medications
                prescription.getMedications().add(medication);
            }
        }
        
        // Save the prescription (cascades to medications)
        Prescription updatedPrescription = prescriptionRepository.save(prescription);
        return convertToResponse(updatedPrescription);
    }
    
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getPatientsWithPrescriptions() {
        try {
            System.out.println("Fetching distinct patients with prescriptions...");
            
            // Get distinct patients who have prescriptions
            List<User> patients = null;
            try {
                patients = prescriptionRepository.findDistinctPatients();
                System.out.println("Found " + (patients != null ? patients.size() : 0) + " patients with prescriptions");
            } catch (Exception e) {
                System.err.println("Error in findDistinctPatients: " + e.getMessage());
                e.printStackTrace();
                throw e;
            }
            
            if (patients == null || patients.isEmpty()) {
                System.out.println("No patients found with prescriptions");
                return Collections.emptyList();
            }
            
            return patients.stream()
                .filter(Objects::nonNull)
                .map(patient -> {
                    Map<String, Object> patientData = new HashMap<>();
                    patientData.put("id", patient.getId());
                    patientData.put("fullName", patient.getFullName() != null ? patient.getFullName() : "");
                    patientData.put("email", patient.getEmail() != null ? patient.getEmail() : "");
                    patientData.put("phone", patient.getPhone() != null ? patient.getPhone() : "");
                    patientData.put("status", patient.getStatus() != null ? patient.getStatus() : "");
                    
                    // Get latest prescription for the patient
                    try {
                        Optional<Prescription> latestPrescription = prescriptionRepository
                            .findTopByPatientOrderByPrescriptionDateDesc(patient);
                            
                        latestPrescription.ifPresent(prescription -> {
                            patientData.put("prescriptionId", prescription.getId());
                            patientData.put("prescriptionDate", prescription.getPrescriptionDate());
                            patientData.put("diagnosis", prescription.getDiagnosis() != null ? prescription.getDiagnosis() : "");
                            patientData.put("status", prescription.getStatus() != null ? prescription.getStatus().toString() : "");
                            
                            // Get medications
                            if (prescription.getMedications() != null) {
                                List<Map<String, Object>> medications = prescription.getMedications().stream()
                                    .map(med -> {
                                        Map<String, Object> medMap = new HashMap<>();
                                        medMap.put("name", med.getName() != null ? med.getName() : "");
                                        medMap.put("dosage", med.getDosage() != null ? med.getDosage() : "");
                                        medMap.put("frequency", med.getFrequency() != null ? med.getFrequency() : "");
                                        return medMap;
                                    })
                                    .collect(Collectors.toList());
                                patientData.put("medications", medications);
                            } else {
                                patientData.put("medications", Collections.emptyList());
                            }
                        });
                    } catch (Exception e) {
                        // Log error and continue with next patient
                        System.err.println("Error processing patient " + patient.getId() + ": " + e.getMessage());
                    }
                    return patientData;
                })
                .collect(Collectors.toList());
        } catch (Exception e) {
            System.err.println("Error in getPatientsWithPrescriptions: " + e.getMessage());
            return Collections.emptyList();
        }
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
    
    @Transactional
    public void deletePrescription(Long id) {
        // This will throw ResourceNotFoundException if prescription not found
        Prescription prescription = prescriptionRepository.findById(id)
            .orElseThrow(() -> new ResourceNotFoundException("Prescription not found with id: " + id));
        
        // The CascadeType.ALL on medications will handle the deletion of related medications
        prescriptionRepository.delete(prescription);
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
