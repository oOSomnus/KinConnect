package com.github.KinConnect;

import com.github.KinConnect.dto.Response;
import com.github.KinConnect.dto.UserRegisterDto;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class AuthIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    void register_shouldReturn201() {
        String url = "http://localhost:" + port + "/auth/register";

        UserRegisterDto dto = new UserRegisterDto();
        dto.setEmail("test@test.com");
        dto.setUsername("test");
        dto.setPassword("qwerty123456");

        ResponseEntity<Response> responseEntity =
                restTemplate.postForEntity(url, dto, Response.class);

        assertThat(responseEntity.getStatusCode()).isEqualTo(HttpStatus.CREATED);
    }

    @Test
    void duplicate_register_shouldReturn409() {
        String url = "http://localhost:" + port + "/auth/register";

        UserRegisterDto dto = new UserRegisterDto();
        dto.setEmail("test@test.com");   // 已存在的 email
        dto.setUsername("test2");
        dto.setPassword("poiuyt123456");

        ResponseEntity<Response> responseEntity =
                restTemplate.postForEntity(url, dto, Response.class);

        assertThat(responseEntity.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }


}

