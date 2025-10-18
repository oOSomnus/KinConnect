package com.github.KinConnect.dto.message;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class MessageUpdateDto {

    private String id;

    @NotBlank(message = "text should not be blank")
    private String text;

    @NotBlank(message = "time should not be blank")
    private String execTime;

    @NotNull()
    private Boolean isOneTime;
}
