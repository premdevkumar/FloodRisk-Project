package com.floodmanagement.api.controller;

import com.floodmanagement.api.entity.User;
import com.floodmanagement.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

/**
 * Administrative endpoints for user management and platform telemetry.
 */
@RestController
@RequestMapping("/api/v1/admin")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;

    @GetMapping("/users")
    public ResponseEntity<List<User>> getAllUsers() {
        List<User> users = userRepository.findAll().stream().map(u -> {
            User sanitized = new User();
            sanitized.setId(u.getId());
            sanitized.setUsername(u.getUsername());
            sanitized.setEmail(u.getEmail());
            sanitized.setRole(u.getRole());
            sanitized.setFullName(u.getFullName());
            sanitized.setPhoneNumber(u.getPhoneNumber());
            sanitized.setDistrict(u.getDistrict());
            sanitized.setState(u.getState());
            sanitized.setPassword("********");
            return sanitized;
        }).collect(Collectors.toList());

        return ResponseEntity.ok(users);
    }
}
