package com.aisae.lms.user;

import com.fasterxml.jackson.annotation.JsonInclude;
import java.time.Instant;

/**
 * Profil détaillé (photo, filière, activité). Distinct de {@link UserSummaryDto}, volontairement léger
 * car utilisé dans des listes (le champ avatar peut peser plusieurs dizaines de Ko).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record UserProfileDto(Long id, String email, String firstName, String lastName, Role role, String field,
                             String level, String avatar, Instant createdAt, Instant lastLoginAt, Activity activity) {

    public record Activity(long conversations, long messages) {}

    public static UserProfileDto of(User u, Activity activity) {
        return new UserProfileDto(u.getId(), u.getEmail(), u.getFirstName(), u.getLastName(), u.getRole(), u.getField(),
                u.getLevel(), u.getAvatar(), u.getCreatedAt(), u.getLastLoginAt(), activity);
    }

    /** Version sans photo ni activité, pour les listes d'administration. */
    public static UserProfileDto listItem(User u) {
        return new UserProfileDto(u.getId(), u.getEmail(), u.getFirstName(), u.getLastName(), u.getRole(), u.getField(),
                u.getLevel(), null, u.getCreatedAt(), u.getLastLoginAt(), null);
    }
}
