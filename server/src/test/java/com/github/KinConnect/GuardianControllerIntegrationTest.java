package com.github.KinConnect;

import com.github.KinConnect.dto.AddOldRequest;
import com.github.KinConnect.dto.Response;
import com.github.KinConnect.dto.auth.UserLoginDto;
import com.github.KinConnect.dto.auth.UserRegisterDto;
import com.github.KinConnect.dto.auth.UserVerifyDto;
import com.github.KinConnect.entities.User;
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
public class GuardianControllerIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private MailService mailService;

    private String guardianJwtToken;
    private Long guardianId;
    private String oldUserEmail;
    private Long oldUserId;

    @BeforeEach
    void setUp() {
        // Create and authenticate a guardian user
        String guardianEmail = "guardian@example.com";
        String guardianUsername = "guardian";
        String guardianPassword = "Password123!";

        registerVerifyAndLogin(guardianEmail, guardianUsername, guardianPassword);
        
        Map<String, Object> data = (Map<String, Object>) getLoginResponse(guardianEmail, guardianPassword).getBody().getData();
        this.guardianJwtToken = (String) data.get("token");
        this.guardianId = userRepository.findByEmail(guardianEmail).getId();

        // Create an old user (elder)
        oldUserEmail = "old@example.com";
        String oldUsername = "olduser";
        String oldPassword = "Password123!";
        
        registerVerifyAndLogin(oldUserEmail, oldUsername, oldPassword);
        
        // Mark the user as "old" (elder)
        User oldUser = userRepository.findByEmail(oldUserEmail);
        oldUser.setIsOld(true);
        userRepository.save(oldUser);
        
        this.oldUserId = oldUser.getId();
    }

    private void registerVerifyAndLogin(String email, String username, String password) {
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
    }

    private ResponseEntity<Response> getLoginResponse(String email, String password) {
        UserLoginDto loginDto = UserLoginDto.builder()
                .email(email)
                .password(password)
                .build();
        
        String loginUrl = "http://localhost:" + port + "/auth/login";
        return restTemplate.postForEntity(loginUrl, loginDto, Response.class);
    }

    @Test
    void addOld_byId_withValidToken_shouldReturn201() {
        // Create a fresh old user for this specific test to avoid conflicts
        String freshOldEmail = "fresh_old_byid@example.com";
        String freshOldUsername = "fresh_old_byid";
        String freshOldPassword = "Password123!";
        
        registerVerifyAndLogin(freshOldEmail, freshOldUsername, freshOldPassword);
        
        User freshOldUser = userRepository.findByEmail(freshOldEmail);
        freshOldUser.setIsOld(true);
        userRepository.save(freshOldUser);
        
        Long freshOldId = freshOldUser.getId();
        
        String url = "http://localhost:" + port + "/guardian/add-olds";
        
        AddOldRequest request = new AddOldRequest();
        request.setOldId(freshOldId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(guardianJwtToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<AddOldRequest> httpRequest = new HttpEntity<>(request, headers);
        
        ResponseEntity<Response> response = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                httpRequest, 
                Response.class
        );
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo(201);
        assertThat(response.getBody().getMessage()).contains("Binding success");
        
        // Verify the relationship was created
        User oldUser = userRepository.findById(freshOldId).orElse(null);
        assertThat(oldUser).isNotNull();
        assertThat(oldUser.getGuardian()).isNotNull();
        assertThat(oldUser.getGuardian().getId()).isEqualTo(guardianId);
    }

    @Test
    void addOld_byEmail_withValidToken_shouldReturn201() {
        String url = "http://localhost:" + port + "/guardian/add-olds";
        
        AddOldRequest request = new AddOldRequest();
        request.setOldEmail(oldUserEmail);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(guardianJwtToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<AddOldRequest> httpRequest = new HttpEntity<>(request, headers);
        
        ResponseEntity<Response> response = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                httpRequest, 
                Response.class
        );
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo(201);
        
        // Verify the relationship was created
        User oldUser = userRepository.findByEmail(oldUserEmail);
        assertThat(oldUser).isNotNull();
        assertThat(oldUser.getGuardian()).isNotNull();
        assertThat(oldUser.getGuardian().getId()).isEqualTo(guardianId);
    }

    @Test
    void addOld_withoutToken_shouldReturn403() {
        String url = "http://localhost:" + port + "/guardian/add-olds";
        
        AddOldRequest request = new AddOldRequest();
        request.setOldId(oldUserId);
        
        ResponseEntity<Response> response = restTemplate.postForEntity(url, request, Response.class);
        
        // Without JWT token, request should be forbidden
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void addOld_withInvalidOldId_shouldReturn404() {
        String url = "http://localhost:" + port + "/guardian/add-olds";
        
        AddOldRequest request = new AddOldRequest();
        request.setOldId(999999L); // Non-existent ID
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(guardianJwtToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<AddOldRequest> httpRequest = new HttpEntity<>(request, headers);
        
        ResponseEntity<Response> response = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                httpRequest, 
                Response.class
        );
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void addOld_withInvalidEmail_shouldReturn404() {
        String url = "http://localhost:" + port + "/guardian/add-olds";
        
        AddOldRequest request = new AddOldRequest();
        request.setOldEmail("nonexistent@example.com");
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(guardianJwtToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<AddOldRequest> httpRequest = new HttpEntity<>(request, headers);
        
        ResponseEntity<Response> response = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                httpRequest, 
                Response.class
        );
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }
}
