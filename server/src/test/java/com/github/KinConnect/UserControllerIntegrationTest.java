package com.github.KinConnect;

import com.github.KinConnect.dto.Response;
import com.github.KinConnect.dto.auth.UserLoginDto;
import com.github.KinConnect.dto.auth.UserLoginResponse;
import com.github.KinConnect.dto.auth.UserRegisterDto;
import com.github.KinConnect.dto.auth.UserVerifyDto;
import com.github.KinConnect.dto.user.UserInfoDto;
import com.github.KinConnect.repositories.UserRepository;
import com.github.KinConnect.services.MailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class UserControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private MailService mailService;

    private String jwtToken;
    private Long userId;

    @BeforeEach
    void setUp() {
        // Register, verify, and login a user to get JWT token
        String email = "usertest@example.com";
        String username = "usertest";
        String password = "Password123!";

        // Register
        UserRegisterDto registerDto = new UserRegisterDto();
        registerDto.setEmail(email);
        registerDto.setUsername(username);
        registerDto.setPassword(password);
        
        String registerUrl = "http://localhost:" + port + "/auth/register";
        restTemplate.postForEntity(registerUrl, registerDto, Response.class);

        // Verify
        String code = userRepository.findByEmail(email).getCode();
        UserVerifyDto verifyDto = new UserVerifyDto();
        verifyDto.setEmail(email);
        verifyDto.setCode(code);
        
        String verifyUrl = "http://localhost:" + port + "/auth/verify-email";
        restTemplate.postForEntity(verifyUrl, verifyDto, Response.class);

        // Login to get JWT token
        UserLoginDto loginDto = UserLoginDto.builder()
                .email(email)
                .password(password)
                .build();
        
        String loginUrl = "http://localhost:" + port + "/auth/login";
        ResponseEntity<Response> loginResponse = restTemplate.postForEntity(loginUrl, loginDto, Response.class);
        
        assertThat(loginResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginResponse.getBody()).isNotNull();
        
        // Extract JWT token from response
        Map<String, Object> data = (Map<String, Object>) loginResponse.getBody().getData();
        this.jwtToken = (String) data.get("token");
        this.userId = userRepository.findByEmail(email).getId();
        
        assertThat(jwtToken).isNotNull();
    }

    @Test
    void getUserInfo_withValidToken_shouldReturn200() {
        String url = "http://localhost:" + port + "/user/info";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);
        
        ResponseEntity<Response> response = restTemplate.exchange(
                url, 
                HttpMethod.GET, 
                request, 
                Response.class
        );
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo(200);
        
        // Verify response structure
        Map<String, Object> data = (Map<String, Object>) response.getBody().getData();
        assertThat(data).isNotNull();
        assertThat(data.get("id")).isNotNull();
        assertThat(data.get("username")).isEqualTo("usertest");
        assertThat(data.get("email")).isEqualTo("usertest@example.com");
        assertThat(data.get("isVerified")).isEqualTo(true);
    }

    @Test
    void getUserInfo_withoutToken_shouldReturn403() {
        String url = "http://localhost:" + port + "/user/info";
        
        ResponseEntity<Response> response = restTemplate.getForEntity(url, Response.class);
        
        // Without JWT token, request should be forbidden
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void switchRole_withValidToken_shouldReturn201() {
        String url = "http://localhost:" + port + "/user/switch-role";
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(jwtToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);
        
        ResponseEntity<Response> response = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                request, 
                Response.class
        );
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo(201);
        
        // Verify role was switched
        Boolean isOld = userRepository.findById(userId).get().getIsOld();
        assertThat(isOld).isNotNull();
    }

    @Test
    void switchRole_withoutToken_shouldReturn403() {
        String url = "http://localhost:" + port + "/user/switch-role";
        
        ResponseEntity<Response> response = restTemplate.postForEntity(url, null, Response.class);
        
        // Without JWT token, request should be forbidden
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }
}
