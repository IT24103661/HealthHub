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
import java.util.Optional;

@RestController
@CrossOrigin(origins = "http://localhost:3000")
@RequestMapping("/api/users")
public class UserController {

    @Autowired
    private UserRepository userRepository;

    // Helper to scrub password from user before returning
    private User scrub(User user) {
        if (user != null) user.setPassword(null);
        return user;
    }

    @GetMapping
    public ResponseEntity<?> listUsers() {
        List<User> users = userRepository.findAll();
        users.forEach(u -> u.setPassword(null));
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("users", users);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getUser(@PathVariable Long id) {
        Optional<User> userOpt = userRepository.findById(id);
        if (userOpt.isEmpty()) throw new UserNotFoundException(id);
        Map<String, Object> response = new HashMap<>();
        response.put("success", true);
        response.put("user", scrub(userOpt.get()));
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<?> createUser(@Valid @RequestBody User newUser) {
        Map<String, Object> response = new HashMap<>();

        // Prevent creating admin via this endpoint
        if ("admin".equalsIgnoreCase(newUser.getRole())) {
            response.put("success", false);
            response.put("message", "Admin accounts cannot be created through this endpoint");
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(response);
        }

        if (userRepository.existsByEmail(newUser.getEmail())) {
            response.put("success", false);
            response.put("message", "Email already registered");
            return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
        }

        // Normalize role to lowercase
        newUser.setRole(newUser.getRole() != null ? newUser.getRole().toLowerCase() : null);

        User saved = userRepository.save(newUser);
        scrub(saved);
        response.put("success", true);
        response.put("message", "User created successfully");
        response.put("user", saved);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<?> updateUser(@PathVariable Long id, @Valid @RequestBody User updated) {
        Map<String, Object> response = new HashMap<>();

        User user = userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));

        // Don't allow changing email to an existing one
        if (updated.getEmail() != null && !updated.getEmail().equalsIgnoreCase(user.getEmail())) {
            if (userRepository.existsByEmail(updated.getEmail())) {
                response.put("success", false);
                response.put("message", "Email already registered");
                return ResponseEntity.status(HttpStatus.CONFLICT).body(response);
            }
            user.setEmail(updated.getEmail());
        }

        if (updated.getFullName() != null) user.setFullName(updated.getFullName());
        if (updated.getPhone() != null) user.setPhone(updated.getPhone());
        if (updated.getAge() != null) user.setAge(updated.getAge());
        if (updated.getPassword() != null && !updated.getPassword().isBlank()) {
            // Note: In production, hash the password.
            user.setPassword(updated.getPassword());
        }
        if (updated.getRole() != null) user.setRole(updated.getRole().toLowerCase());
        if (updated.getStatus() != null) user.setStatus(updated.getStatus());

        User saved = userRepository.save(user);
        scrub(saved);
        response.put("success", true);
        response.put("message", "User updated successfully");
        response.put("user", saved);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/role")
    public ResponseEntity<?> updateRole(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Map<String, Object> response = new HashMap<>();
        String role = payload.get("role");
        if (role == null) {
            response.put("success", false);
            response.put("message", "Role is required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        User user = userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
        user.setRole(role.toLowerCase());
        User saved = userRepository.save(user);
        scrub(saved);
        response.put("success", true);
        response.put("message", "Role updated successfully");
        response.put("user", saved);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<?> updateStatus(@PathVariable Long id, @RequestBody Map<String, String> payload) {
        Map<String, Object> response = new HashMap<>();
        String status = payload.get("status");
        if (status == null) {
            response.put("success", false);
            response.put("message", "Status is required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }
        User user = userRepository.findById(id).orElseThrow(() -> new UserNotFoundException(id));
        user.setStatus(status);
        User saved = userRepository.save(user);
        scrub(saved);
        response.put("success", true);
        response.put("message", "Status updated successfully");
        response.put("user", saved);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteUser(@PathVariable Long id) {
        Map<String, Object> response = new HashMap<>();
        if (!userRepository.existsById(id)) {
            throw new UserNotFoundException(id);
        }
        userRepository.deleteById(id);
        response.put("success", true);
        response.put("message", "User deleted successfully");
        return ResponseEntity.ok(response);
    }
}
