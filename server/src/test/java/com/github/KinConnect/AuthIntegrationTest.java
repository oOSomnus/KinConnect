package com.github.KinConnect;

import com.github.KinConnect.dto.Response;
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
        String url = "http://localhost:" + port + "/auth/register?email=test@test.com&username=test&password=qwerty123456";
        ResponseEntity<Response> responseEntity =
                restTemplate.postForEntity(url, null, Response.class);

        assertThat(responseEntity.getStatusCode()).isEqualTo(HttpStatus.CREATED);

    }

    @Test
    void duplicate_register_shouldReturn409() {
        String url = "http://localhost:" + port + "/auth/register?email=test@test.com&username=test&password=qwerty123456";
        ResponseEntity<Response> responseEntity =
                restTemplate.postForEntity(url, null, Response.class);

        assertThat(responseEntity.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);
    }
}
