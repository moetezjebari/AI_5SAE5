package com.aisae.lms.security;

import com.aisae.lms.security.dto.AuthResponse;
import com.aisae.lms.security.dto.LoginRequest;
import com.aisae.lms.security.dto.PasswordChangeRequest;
import com.aisae.lms.security.dto.ProfileUpdateRequest;
import com.aisae.lms.security.dto.RegisterRequest;
import com.aisae.lms.user.User;
import com.aisae.lms.user.UserSummaryDto;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<AuthResponse> register(@Valid @RequestBody RegisterRequest request) {
        return ResponseEntity.ok(authService.register(request));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        return ResponseEntity.ok(authService.login(request));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(@AuthenticationPrincipal User user) {
        authService.logout(user);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    public ResponseEntity<UserSummaryDto> me(@AuthenticationPrincipal User user) {
        return ResponseEntity.ok(UserSummaryDto.from(user));
    }

    @PutMapping("/profile")
    public ResponseEntity<UserSummaryDto> updateProfile(@AuthenticationPrincipal User user,
                                                         @Valid @RequestBody ProfileUpdateRequest request) {
        return ResponseEntity.ok(authService.updateProfile(user, request));
    }

    @PutMapping("/password")
    public ResponseEntity<Void> changePassword(@AuthenticationPrincipal User user,
                                               @Valid @RequestBody PasswordChangeRequest request) {
        authService.changePassword(user, request);
        return ResponseEntity.noContent().build();
    }
}
