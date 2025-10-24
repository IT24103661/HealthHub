package BackEnd.controller;

import BackEnd.exception.UserNotFoundException;
import BackEnd.model.User;
import BackEnd.repository.UserRepository;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // Get all users from database
    @GetMapping
    public ResponseEntity<?> getAllUsers() {
        try {
            System.out.println("Fetching all users...");
            List<User> users = userRepository.findAll();
            System.out.println("Found " + users.size() + " users");
            
            // Create a list of DTOs to avoid lazy loading issues
            List<Map<String, Object>> userDtos = users.stream().map(user -> {
                Map<String, Object> dto = new HashMap<>();
                dto.put("id", user.getId());
                dto.put("fullName", user.getFullName());
                dto.put("email", user.getEmail());
                dto.put("role", user.getRole());
                dto.put("phone", user.getPhone());
                dto.put("status", user.getStatus());
                // Add other non-sensitive fields as needed
                return dto;
            }).collect(Collectors.toList());
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("users", userDtos);
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            System.err.println("Error fetching users: " + e.getMessage());
            e.printStackTrace();
            
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch users: " + e.getMessage());
            response.put("errorType", e.getClass().getName());
            if (e.getCause() != null) {
                response.put("cause", e.getCause().getMessage());
            }
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Get user by ID
    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@RequestHeader("Authorization") String authHeader) {
        try {
            // Validate Authorization header
            if (authHeader == null || !authHeader.startsWith("Bearer ")) {
                throw new SecurityException("Invalid or missing Authorization header");
            }
            
            // Extract and validate token
            String token = authHeader.substring(7).trim();
            if (token.isEmpty()) {
                throw new SecurityException("Missing authentication token");
            }
            
            // In a real application, you would validate the JWT token here
            // and extract the user ID from it. For now, we'll just log the token
            // and return the first user as an example.
            System.out.println("Validating token: " + token.substring(0, Math.min(10, token.length())) + "...");
            
            // Get the first user as an example (replace with actual user lookup from token)
            User user = userRepository.findAll().stream().findFirst()
                    .orElseThrow(() -> new UserNotFoundException("No users found"));
                    
            // Clear sensitive data
            user.setPassword(null);
            
            // Prepare response
            Map<String, Object> response = new HashMap<>();
            response.put("success", true);
            response.put("user", user);
            response.put("message", "User authenticated successfully");
            
            return ResponseEntity.ok(response);
            
        } catch (Exception e) {
            Map<String, Object> errorResponse = new HashMap<>();
            errorResponse.put("success", false);
            errorResponse.put("message", "Failed to fetch current user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(errorResponse);
        }
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUserById(@PathVariable Long id) {
        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new UserNotFoundException(id));
            user.setPassword(null);
            return ResponseEntity.ok(user);
        } catch (UserNotFoundException e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            Map<String, Object> response = new HashMap<>();
            response.put("success", false);
            response.put("message", "Failed to fetch user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Create new user (admin only)
    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody User newUser) {
        Map<String, Object> response = new HashMap<>();

        try {
            // Check if email already exists
            if (userRepository.existsByEmail(newUser.getEmail())) {
                response.put("success", false);
                response.put("message", "Email already registered");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }

            // Validate role
            String role = newUser.getRole().toLowerCase();
            if (!role.equals("user") && !role.equals("doctor") && 
                !role.equals("dietitian") && !role.equals("receptionist") && !role.equals("admin")) {
                response.put("success", false);
                response.put("message", "Invalid role. Must be one of: user, doctor, dietitian, receptionist, admin");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            newUser.setRole(role);

            // Save user
            User savedUser = userRepository.save(newUser);
            savedUser.setPassword(null);

            response.put("success", true);
            response.put("message", "User created successfully");
            response.put("user", savedUser);

            return ResponseEntity.status(HttpStatus.CREATED).body(response);

        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to create user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Update user
    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody User updatedUser) {
        Map<String, Object> response = new HashMap<>();

        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new UserNotFoundException(id));

            // Check if email is being changed and if it already exists
            if (!user.getEmail().equals(updatedUser.getEmail()) && 
                userRepository.existsByEmail(updatedUser.getEmail())) {
                response.put("success", false);
                response.put("message", "Email already registered");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }

            // Update fields
            user.setFullName(updatedUser.getFullName());
            user.setEmail(updatedUser.getEmail());
            
            // Only update password if provided
            if (updatedUser.getPassword() != null && !updatedUser.getPassword().isEmpty()) {
                user.setPassword(updatedUser.getPassword());
            }
            
            user.setRole(updatedUser.getRole().toLowerCase());
            user.setPhone(updatedUser.getPhone());
            user.setAge(updatedUser.getAge());
            user.setStatus(updatedUser.getStatus());

            User savedUser = userRepository.save(user);
            savedUser.setPassword(null);

            response.put("success", true);
            response.put("message", "User updated successfully");
            response.put("user", savedUser);

            return ResponseEntity.ok(response);

        } catch (UserNotFoundException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to update user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Delete user
    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();

        try {
            if (!userRepository.existsById(id)) {
                throw new UserNotFoundException(id);
            }

            userRepository.deleteById(id);

            response.put("success", true);
            response.put("message", "User with id " + id + " has been deleted successfully");

            return ResponseEntity.ok(response);

        } catch (UserNotFoundException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to delete user: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Update user status (activate/deactivate)
    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateUserStatus(@PathVariable Long id, @RequestBody Map<String, String> statusData) {
        Map<String, Object> response = new HashMap<>();

        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new UserNotFoundException(id));

            String newStatus = statusData.get("status");
            if (newStatus == null || newStatus.isEmpty()) {
                response.put("success", false);
                response.put("message", "Status is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            user.setStatus(newStatus);
            User savedUser = userRepository.save(user);
            savedUser.setPassword(null);

            response.put("success", true);
            response.put("message", "User status updated successfully");
            response.put("user", savedUser);

            return ResponseEntity.ok(response);

        } catch (UserNotFoundException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to update user status: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }

    // Update user role
    @PatchMapping("/{id}/role")
    public ResponseEntity<?> updateUserRole(@PathVariable Long id, @RequestBody Map<String, String> roleData) {
        Map<String, Object> response = new HashMap<>();

        try {
            User user = userRepository.findById(id)
                    .orElseThrow(() -> new UserNotFoundException(id));

            String newRole = roleData.get("role");
            if (newRole == null || newRole.isEmpty()) {
                response.put("success", false);
                response.put("message", "Role is required");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            // Validate role
            String role = newRole.toLowerCase();
            if (!role.equals("user") && !role.equals("doctor") && 
                !role.equals("dietitian") && !role.equals("receptionist") && !role.equals("admin")) {
                response.put("success", false);
                response.put("message", "Invalid role. Must be one of: user, doctor, dietitian, receptionist, admin");
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            user.setRole(role);
            User savedUser = userRepository.save(user);
            savedUser.setPassword(null);

            response.put("success", true);
            response.put("message", "User role updated successfully");
            response.put("user", savedUser);

            return ResponseEntity.ok(response);

        } catch (UserNotFoundException e) {
            response.put("success", false);
            response.put("message", e.getMessage());
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        } catch (Exception e) {
            response.put("success", false);
            response.put("message", "Failed to update user role: " + e.getMessage());
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(response);
        }
    }
}
