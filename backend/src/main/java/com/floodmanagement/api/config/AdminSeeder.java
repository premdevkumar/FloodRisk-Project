package com.floodmanagement.api.config;

import com.floodmanagement.api.entity.User;
import com.floodmanagement.api.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

/**
 * Seeds initial administrative credentials if not already present.
 */
@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (!userRepository.existsByUsername("premdevkumar")) {
            User admin = User.builder()
                    .username("premdevkumar")
                    .password(passwordEncoder.encode("Admin@12345"))
                    .email("premdevkumar@floodmanagement.gov.in")
                    .role("ADMIN")
                    .fullName("Prem Dev Kumar (System SuperAdmin)")
                    .phoneNumber("+91-9876543210")
                    .district("Central HQ")
                    .state("National Capital")
                    .build();
            userRepository.save(admin);
            log.info("Default administrator account '{}' provisioned successfully", admin.getUsername());
        }
    }
}
