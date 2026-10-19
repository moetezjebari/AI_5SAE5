package com.aisae.lms.user;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/users")
public class UserController {
    private final UserService service;

    public UserController(UserService service) {
        this.service = service;
    }

    @GetMapping("/me")
    public UserProfileDto me(@AuthenticationPrincipal User me) {
        return service.profile(me.getId());
    }

    @PutMapping("/me/avatar")
    public UserProfileDto avatar(@AuthenticationPrincipal User me, @Valid @RequestBody UserRequests.UpdateAvatar req) {
        return service.setAvatar(me.getId(), req.dataUrl());
    }

    @DeleteMapping("/me/avatar")
    public UserProfileDto removeAvatar(@AuthenticationPrincipal User me) {
        return service.removeAvatar(me.getId());
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<UserProfileDto> all() {
        return service.listAll();
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN') or #id == principal.id")
    public UserProfileDto byId(@PathVariable Long id) {
        return service.profile(id);
    }

    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('ADMIN')")
    public UserProfileDto role(@AuthenticationPrincipal User me, @PathVariable Long id,
                               @Valid @RequestBody UserRequests.UpdateRole req) {
        return service.changeRole(me.getId(), id, req.role());
    }
}
