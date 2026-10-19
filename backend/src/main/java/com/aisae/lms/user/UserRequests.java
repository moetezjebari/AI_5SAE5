package com.aisae.lms.user;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public final class UserRequests {
    private UserRequests() {}

    public record UpdateAvatar(@NotBlank @Size(max = 400_000, message = "Image trop volumineuse") String dataUrl) {}

    public record UpdateRole(@NotNull(message = "Rôle requis") Role role) {}
}
