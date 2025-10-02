package BackEnd.controller;

import BackEnd.model.User;
import BackEnd.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/auth")
public class SignupController {

    @Autowired
    private UserRepository userRepository;

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@Valid @RequestBody User newUser) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Validate that role is not admin
            if ("admin".equalsIgnoreCase(newUser.getRole())) {
                response.put("success", false);
                response.put("message", "Admin accounts cannot be created through signup");
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            // Check if email already exists
            if (userRepository.existsByEmail(newUser.getEmail())) {
                response.put("success", false);
                response.put("message", "Email already registered");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }

            // Validate role
            String role = newUser.getRole().toLowerCase();
            if (!role.equals("user") && !role.equals("doctor") && 
                !role.equals("dietitian") && !role.equals("receptionist")) {
                response.put("success", false);
                response.put("message", "Invalid role. Must be one of: user, doctor, dietitian, receptionist");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // Set role to lowercase for consistency
            newUser.setRole(role);

            // In production, you should hash the password here
            // For now, storing as plain text (NOT RECOMMENDED for production)
            // Example with BCrypt:
            // String hashedPassword = BCrypt.hashpw(newUser.getPassword(), BCrypt.gensalt());
            // newUser.setPassword(hashedPassword);

            // Save user
            User savedUser = userRepository.save(newUser);

            // Remove password from response
            savedUser.setPassword(null);

            response.put("success", true);
            response.put("message", "Account created successfully");
            response.put("user", savedUser);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to create account: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody Map<String, String> loginData) {
        Map<String, Object> response = new HashMap<>();

        try {
            String email = loginData.get("email");
            String password = loginData.get("password");
            String role = loginData.get("role");

            if (email == null || password == null || role == null) {
                response.put("success", false);
                response.put("message", "Email, password, and role are required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // Find user by email and password (in production, compare hashed passwords)
            User user = userRepository.findByEmailAndPassword(email, password)
                    .orElse(null);

            if (user == null) {
                response.put("success", false);
                response.put("message", "Invalid email or password");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            // Check if role matches
            if (!user.getRole().equalsIgnoreCase(role)) {
                response.put("success", false);
                response.put("message", "Invalid role for this account");
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
            }

            // Check if account is active
            if (!"active".equalsIgnoreCase(user.getStatus())) {
                response.put("success", false);
                response.put("message", "Account is " + user.getStatus());
                return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
            }

            // Remove password from response
            user.setPassword(null);

            response.put("success", true);
            response.put("message", "Login successful");
            response.put("user", user);

            return ResponseEntity.ok(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Login failed: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    @GetMapping("/check-email")
    public ResponseEntity<?> checkEmail(@RequestParam String email) {
        Map<String, Object> response = new HashMap<>();
        
        boolean exists = userRepository.existsByEmail(email);
        response.put("exists", exists);
        
        return ResponseEntity.ok(response);
    }
}
