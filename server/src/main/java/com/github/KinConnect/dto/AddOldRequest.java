package com.github.KinConnect.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Positive;
import lombok.Data;

/**
 * Request payload for binding an elder to the current guardian.
 * Exactly one of {@link #oldId} or {@link #oldEmail} should be provided;
 * this constraint is enforced in the service layer to keep validation simple.
 */
@Data
public class AddOldRequest {

    @Positive(message = "oldId must be positive")
    private Long oldId;

    @Email(message = "oldEmail should be a valid email address")
    private String oldEmail;
}
