package com.aisae.lms.recommendation;

record Candidate(String type, Long resourceId, String title, String priority, String action,
                  String topic, String defaultReason) {
}
