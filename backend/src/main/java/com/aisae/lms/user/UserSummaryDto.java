package com.aisae.lms.user;

public record UserSummaryDto(Long id, String email, String firstName, String lastName, Role role) {
    public static UserSummaryDto from(User user) {
        return new UserSummaryDto(user.getId(), user.getEmail(), user.getFirstName(), user.getLastName(), user.getRole());
    }
}
