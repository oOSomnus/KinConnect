package com.github.KinConnect;

import com.github.KinConnect.dto.Response;
import com.github.KinConnect.dto.auth.UserLoginDto;
import com.github.KinConnect.dto.auth.UserRegisterDto;
import com.github.KinConnect.dto.auth.UserVerifyDto;
import com.github.KinConnect.repositories.UserRepository;
import com.github.KinConnect.services.MailService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.bean.override.mockito.MockitoBean;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@ActiveProfiles("test")
public class AuthIntegrationTest {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private UserRepository userRepository;

    @MockitoBean
    private MailService mailService;

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

//    @Test
//    void duplicate_register_shouldReturn409() {
//        String url = "http://localhost:" + port + "/auth/register";
//
//        UserRegisterDto dto = new UserRegisterDto();
//        dto.setEmail("test@test.com");   // 已存在的 email
//        dto.setUsername("test2");
//        dto.setPassword("poiuyt123456");
//
//        ResponseEntity<Response> responseEntity =
//                restTemplate.postForEntity(url, dto, Response.class);
//
//        assertThat(responseEntity.getStatusCode()).isEqualTo(HttpStatus.CREATED);
//    }

    @Test
    void verify_shouldReturn201() {
        String email = "verify@test.com";
        String registerUrl = "http://localhost:" + port + "/auth/register";
        String verifyUrl = "http://localhost:" + port + "/auth/verify-email";
        UserRegisterDto registerDto = new UserRegisterDto();
        registerDto.setEmail(email);
        registerDto.setUsername("verify");
        registerDto.setPassword("poiuyt123456");

        ResponseEntity<Response> registerResponseEntity =
                restTemplate.postForEntity(registerUrl, registerDto, Response.class);

        assertThat(registerResponseEntity.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<Response> reRegisterResponseEntity =
                restTemplate.postForEntity(registerUrl, registerDto, Response.class);
        assertThat(reRegisterResponseEntity.getStatusCode()).isEqualTo(HttpStatus.CREATED);


        String code = userRepository.findByEmail(email).getCode();

        assertThat(code).isNotNull();

        UserVerifyDto verifyDto = new UserVerifyDto();
        verifyDto.setEmail(email);
        verifyDto.setCode(code);

        ResponseEntity<Response> verifyResponseEntity = restTemplate.postForEntity(verifyUrl, verifyDto, Response.class);

        assertThat(verifyResponseEntity.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        ResponseEntity<Response> dupRegisterResponseEntity =
                restTemplate.postForEntity(registerUrl, registerDto, Response.class);
        assertThat(dupRegisterResponseEntity.getStatusCode()).isEqualTo(HttpStatus.CONFLICT);

    }

    @Test
    void verify_unknownEmail_shouldReturn400() {
        String url = "http://localhost:" + port + "/auth/verify-email";

        UserVerifyDto dto = UserVerifyDto.builder()
                .email("no_such_user@example.com")
                .code("000000") // any code; service should 404 on unknown email
                .build();

        ResponseEntity<Response> response =
                restTemplate.postForEntity(url, dto, Response.class);

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
    }

    @Test
    void login_beforeVerification_shouldReturn400() {
        // 1) register a fresh user
        String registerUrl = "http://localhost:" + port + "/auth/register";
        String uname = "unverified_user";
        String email = "unverified_user@example.com";
        String pwd = "Password123!";

        UserRegisterDto reg = new UserRegisterDto();
        reg.setEmail(email);
        reg.setUsername(uname);
        reg.setPassword(pwd);
        ResponseEntity<Response> regResp =
                restTemplate.postForEntity(registerUrl, reg, Response.class);
        assertThat(regResp.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // 2) attempt login BEFORE email verification
        String loginUrl = "http://localhost:" + port + "/auth/login";
        UserLoginDto login = UserLoginDto.builder()
                .email(email)     // your login uses username field
                .password(pwd)
                .build();

        ResponseEntity<Response> loginResp =
                restTemplate.postForEntity(loginUrl, login, Response.class);


        // Expect 400 BAD_REQUEST (email not verified)
        assertThat(loginResp.getStatusCode()).isEqualTo(HttpStatus.BAD_REQUEST);
    }


}



