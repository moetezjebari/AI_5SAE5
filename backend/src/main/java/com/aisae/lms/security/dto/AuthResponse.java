package com.aisae.lms.security.dto;

import com.aisae.lms.user.UserSummaryDto;

public record AuthResponse(String token, UserSummaryDto user) {
}
