package com.aisae.lms.security.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;

public record ProfileUpdateRequest(
        @NotBlank(message = "Le prénom est obligatoire")
        String firstName,

        @NotBlank(message = "Le nom est obligatoire")
        String lastName,

        @NotBlank(message = "L'e-mail est obligatoire")
        @Email(message = "Format d'e-mail invalide")
        String email,

        /** Facultatifs : absent = inchangé, chaîne vide = effacé. */
        @jakarta.validation.constraints.Size(max = 80) String field,
        @jakarta.validation.constraints.Size(max = 40) String level
) {
}
