package com.floodmanagement.api.controller;

import com.floodmanagement.api.entity.User;
import com.floodmanagement.api.repository.UserRepository;
import com.floodmanagement.api.security.JwtUtil;
import lombok.Builder;
import lombok.Data;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.Map;
import java.util.regex.Pattern;

/**
 * Controller handling user registration and stateless JWT authentication.
 */
@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    private static final Pattern PASSWORD_PATTERN = Pattern.compile(
            "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&#])[A-Za-z\\d@$!%*?&#]{8,}$"
    );

    @Data
    public static class LoginRequest {
        private String username;
        private String password;
    }

    @Data
    public static class RegisterRequest {
        private String username;
        private String password;
        private String email;
        private String role; // RESIDENT, FARMER, OFFICIAL, ADMIN
        private String fullName;
        private String phoneNumber;
        private String district;
        private String state;
    }

    @Data
    @Builder
    public static class AuthResponse {
        private String token;
        private String username;
        private String role;
        private String fullName;
        private String message;
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest req) {
        var userOpt = userRepository.findByUsername(req.getUsername());
        if (userOpt.isEmpty() || !passwordEncoder.matches(req.getPassword(), userOpt.get().getPassword())) {
            return ResponseEntity.status(401).body(Map.of("error", "Invalid username or password"));
        }

        User user = userOpt.get();
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole())
                .fullName(user.getFullName())
                .message("Authentication successful")
                .build());
    }

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest req) {
        if (userRepository.existsByUsername(req.getUsername())) {
            return ResponseEntity.badRequest().body(Map.of("error", "Username already exists"));
        }

        if (req.getPassword() == null || !PASSWORD_PATTERN.matcher(req.getPassword()).matches()) {
            return ResponseEntity.badRequest().body(Map.of(
                    "error", "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one digit, and one special character (@$!%*?&#)."
            ));
        }

        String targetRole = req.getRole() != null ? req.getRole().toUpperCase() : "RESIDENT";
        if ("ADMIN".equals(targetRole)) {
            return ResponseEntity.badRequest().body(Map.of("error", "Admin accounts cannot be registered publicly. Please use the pre-configured master Admin account."));
        }

        User user = User.builder()
                .username(req.getUsername())
                .password(passwordEncoder.encode(req.getPassword()))
                .email(req.getEmail())
                .role(targetRole)
                .fullName(req.getFullName())
                .phoneNumber(req.getPhoneNumber())
                .district(req.getDistrict())
                .state(req.getState())
                .build();

        userRepository.save(user);
        String token = jwtUtil.generateToken(user.getUsername(), user.getRole());

        return ResponseEntity.ok(AuthResponse.builder()
                .token(token)
                .username(user.getUsername())
                .role(user.getRole())
                .fullName(user.getFullName())
                .message("Registration successful")
                .build());
    }
}
