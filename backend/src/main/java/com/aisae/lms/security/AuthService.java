package com.aisae.lms.security;

import com.aisae.lms.common.ApiException;
import com.aisae.lms.security.dto.AuthResponse;
import com.aisae.lms.security.dto.LoginRequest;
import com.aisae.lms.security.dto.PasswordChangeRequest;
import com.aisae.lms.security.dto.ProfileUpdateRequest;
import com.aisae.lms.security.dto.RegisterRequest;
import com.aisae.lms.user.Role;
import com.aisae.lms.user.User;
import com.aisae.lms.user.UserRepository;
import com.aisae.lms.user.UserSummaryDto;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.Map;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;

    public AuthService(UserRepository userRepository, PasswordEncoder passwordEncoder,
                        JwtService jwtService, AuthenticationManager authenticationManager) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.authenticationManager = authenticationManager;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String email = request.email().trim().toLowerCase();
        if (userRepository.existsByEmail(email)) {
            throw ApiException.conflict("Un compte existe déjà avec cet e-mail");
        }
        Role role = request.role() == null ? Role.STUDENT : request.role();
        if (role == Role.ADMIN) {
            throw ApiException.forbidden("Ce rôle ne peut pas être choisi à l'inscription");
        }

        User user = new User();
        user.setEmail(email);
        user.setPasswordHash(passwordEncoder.encode(request.password()));
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setRole(role); // STUDENT ou TEACHER au choix ; ADMIN uniquement attribué par un administrateur
        user.setLastLoginAt(java.time.Instant.now());

        User saved = userRepository.save(user);
        return buildAuthResponse(saved);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.email().trim().toLowerCase(), request.password()));

        User user = userRepository.findByEmail(request.email().trim().toLowerCase())
                .orElseThrow(() -> ApiException.notFound("Utilisateur introuvable"));
        user.setLastLoginAt(java.time.Instant.now());
        userRepository.save(user);
        return buildAuthResponse(user);
    }

    private AuthResponse buildAuthResponse(User user) {
        String token = jwtService.generateToken(user.getEmail(), Map.of(
                "role", user.getRole().name(),
                "userId", user.getId(),
                "firstName", user.getFirstName() != null ? user.getFirstName() : "",
                "lastName", user.getLastName() != null ? user.getLastName() : "",
                "tv", user.getTokenVersion()
        ));
        return new AuthResponse(token, UserSummaryDto.from(user));
    }

    @Transactional
    public UserSummaryDto updateProfile(User user, ProfileUpdateRequest request) {
        String cleanEmail = request.email().trim().toLowerCase();
        if (!user.getEmail().equalsIgnoreCase(cleanEmail) && userRepository.existsByEmail(cleanEmail)) {
            throw ApiException.conflict("Un compte existe déjà avec cet e-mail");
        }
        user.setFirstName(request.firstName().trim());
        user.setLastName(request.lastName().trim());
        user.setEmail(cleanEmail);
        if (request.field() != null) user.setField(request.field().isBlank() ? null : request.field().trim());
        if (request.level() != null) user.setLevel(request.level().isBlank() ? null : request.level().trim());
        User saved = userRepository.save(user);
        return UserSummaryDto.from(saved);
    }

    /** Invalide tous les jetons déjà émis pour ce compte. */
    @Transactional
    public void logout(User user) {
        userRepository.findById(user.getId()).ifPresent(u -> u.setTokenVersion(u.getTokenVersion() + 1));
    }

    @Transactional
    public void changePassword(User user, PasswordChangeRequest request) {
        if (!passwordEncoder.matches(request.current(), user.getPasswordHash())) {
            throw ApiException.badRequest("Le mot de passe actuel est incorrect");
        }
        user.setPasswordHash(passwordEncoder.encode(request.next()));
        userRepository.save(user);
    }
}
