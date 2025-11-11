package com.github.KinConnect;

import com.github.KinConnect.dto.AddOldRequest;
import com.github.KinConnect.dto.Response;
import com.github.KinConnect.dto.auth.UserLoginDto;
import com.github.KinConnect.dto.auth.UserRegisterDto;
import com.github.KinConnect.dto.auth.UserVerifyDto;
import com.github.KinConnect.dto.message.MessageUpdateDto;
import com.github.KinConnect.entities.User;
import com.github.KinConnect.repositories.UserRepository;
import com.github.KinConnect.services.MailService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class MsgControllerIntegrationTest {

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
    private Long oldUserId;

    @BeforeEach
    void setUp() {
        // Create and authenticate a guardian user
        String guardianEmail = "msg_guardian@example.com";
        String guardianUsername = "msg_guardian";
        String guardianPassword = "Password123!";

        registerVerifyAndLogin(guardianEmail, guardianUsername, guardianPassword);
        
        Map<String, Object> data = (Map<String, Object>) getLoginResponse(guardianEmail, guardianPassword).getBody().getData();
        this.guardianJwtToken = (String) data.get("token");
        this.guardianId = userRepository.findByEmail(guardianEmail).getId();

        // Create an old user (elder)
        String oldUserEmail = "msg_old@example.com";
        String oldUsername = "msg_olduser";
        String oldPassword = "Password123!";
        
        registerVerifyAndLogin(oldUserEmail, oldUsername, oldPassword);
        
        // Mark the user as "old" (elder)
        User oldUser = userRepository.findByEmail(oldUserEmail);
        oldUser.setIsOld(true);
        userRepository.save(oldUser);
        
        this.oldUserId = oldUser.getId();
        
        // Bind guardian to old user
        bindGuardianToOld();
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

    private void bindGuardianToOld() {
        String url = "http://localhost:" + port + "/guardian/add-olds";
        
        AddOldRequest request = new AddOldRequest();
        request.setOldId(oldUserId);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(guardianJwtToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<AddOldRequest> httpRequest = new HttpEntity<>(request, headers);
        
        restTemplate.exchange(url, HttpMethod.POST, httpRequest, Response.class);
    }

    @Test
    void getMessage_withValidToken_shouldReturn200() {
        String url = "http://localhost:" + port + "/messages/" + oldUserId;
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(guardianJwtToken);
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
        
        // Initially, the message list should be empty or contain data
        Object data = response.getBody().getData();
        assertThat(data).isNotNull();
    }

    @Test
    void getMessage_withoutToken_shouldReturn403() {
        String url = "http://localhost:" + port + "/messages/" + oldUserId;
        
        ResponseEntity<Response> response = restTemplate.getForEntity(url, Response.class);
        
        // Without JWT token, request should be forbidden
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void getMessage_withUnrelatedUser_shouldReturn400() {
        // Create another guardian who is not related to the old user
        String unrelatedEmail = "unrelated@example.com";
        String unrelatedUsername = "unrelated";
        String unrelatedPassword = "Password123!";
        
        registerVerifyAndLogin(unrelatedEmail, unrelatedUsername, unrelatedPassword);
        
        Map<String, Object> data = (Map<String, Object>) getLoginResponse(unrelatedEmail, unrelatedPassword).getBody().getData();
        String unrelatedToken = (String) data.get("token");
        
        String url = "http://localhost:" + port + "/messages/" + oldUserId;
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(unrelatedToken);
        HttpEntity<Void> request = new HttpEntity<>(headers);
        
        ResponseEntity<Response> response = restTemplate.exchange(
                url, 
                HttpMethod.GET, 
                request, 
                Response.class
        );
        
        // Unrelated guardian should not be able to access messages
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }

    @Test
    void updateMessages_withValidToken_shouldReturn201() {
        String url = "http://localhost:" + port + "/messages/update/" + oldUserId;
        
        List<MessageUpdateDto> messageList = new ArrayList<>();
        
        MessageUpdateDto message1 = MessageUpdateDto.builder()
                .text("Take your medicine")
                .execTime("0 0 9 * * ?")  // Every day at 9:00 AM
                .isOneTime(false)
                .build();
        
        MessageUpdateDto message2 = MessageUpdateDto.builder()
                .text("Doctor appointment tomorrow")
                .execTime("0 0 10 * * ?")  // Every day at 10:00 AM
                .isOneTime(true)
                .build();
        
        messageList.add(message1);
        messageList.add(message2);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(guardianJwtToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<List<MessageUpdateDto>> request = new HttpEntity<>(messageList, headers);
        
        ResponseEntity<Response> response = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                request, 
                Response.class
        );
        
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(response.getBody()).isNotNull();
        assertThat(response.getBody().getCode()).isEqualTo(201);
        assertThat(response.getBody().getMessage()).isEqualTo("ok");
    }

    @Test
    void updateMessages_withoutToken_shouldReturn403() {
        String url = "http://localhost:" + port + "/messages/update/" + oldUserId;
        
        List<MessageUpdateDto> messageList = new ArrayList<>();
        MessageUpdateDto message = MessageUpdateDto.builder()
                .text("Test message")
                .execTime("0 0 9 * * ?")
                .isOneTime(false)
                .build();
        messageList.add(message);
        
        ResponseEntity<Response> response = restTemplate.postForEntity(url, messageList, Response.class);
        
        // Without JWT token, request should be forbidden
        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.FORBIDDEN);
    }

    @Test
    void updateMessages_withInvalidData_shouldReturnError() {
        String url = "http://localhost:" + port + "/messages/update/" + oldUserId;
        
        List<MessageUpdateDto> messageList = new ArrayList<>();
        
        // Message with missing required fields (text is blank)
        MessageUpdateDto invalidMessage = MessageUpdateDto.builder()
                .text("")  // Invalid: blank text
                .execTime("0 0 9 * * ?")
                .isOneTime(false)
                .build();
        
        messageList.add(invalidMessage);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(guardianJwtToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<List<MessageUpdateDto>> request = new HttpEntity<>(messageList, headers);
        
        ResponseEntity<Response> response = restTemplate.exchange(
                url, 
                HttpMethod.POST, 
                request, 
                Response.class
        );
        
        // Should return an error status code (either 400 or 500 for validation failure)
        assertThat(response.getStatusCode().isError()).isTrue();
    }

    @Test
    void updateMessages_thenGetMessages_shouldReturnUpdatedMessages() {
        // First, update messages
        String updateUrl = "http://localhost:" + port + "/messages/update/" + oldUserId;
        
        List<MessageUpdateDto> messageList = new ArrayList<>();
        MessageUpdateDto message = MessageUpdateDto.builder()
                .text("Remember to drink water")
                .execTime("0 0 8 * * ?")
                .isOneTime(false)
                .build();
        messageList.add(message);
        
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(guardianJwtToken);
        headers.setContentType(MediaType.APPLICATION_JSON);
        HttpEntity<List<MessageUpdateDto>> updateRequest = new HttpEntity<>(messageList, headers);
        
        ResponseEntity<Response> updateResponse = restTemplate.exchange(
                updateUrl, 
                HttpMethod.POST, 
                updateRequest, 
                Response.class
        );
        
        assertThat(updateResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        
        // Then, get messages to verify they were stored
        String getUrl = "http://localhost:" + port + "/messages/" + oldUserId;
        HttpEntity<Void> getRequest = new HttpEntity<>(headers);
        
        ResponseEntity<Response> getResponse = restTemplate.exchange(
                getUrl, 
                HttpMethod.GET, 
                getRequest, 
                Response.class
        );
        
        assertThat(getResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(getResponse.getBody()).isNotNull();
        assertThat(getResponse.getBody().getData()).isNotNull();
        
        // Verify the returned data is a list
        List<Map<String, Object>> messages = (List<Map<String, Object>>) getResponse.getBody().getData();
        assertThat(messages).isNotEmpty();
        assertThat(messages.get(0).get("text")).isEqualTo("Remember to drink water");
    }
}
