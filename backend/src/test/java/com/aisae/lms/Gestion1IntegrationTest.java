package com.aisae.lms;

import static org.hamcrest.Matchers.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import com.aisae.lms.assistant.AiClient;
import com.aisae.lms.assistant.GeminiAssistantClient;
import com.aisae.lms.recommendation.GeminiClient;
import com.aisae.lms.recommendation.GeminiProperties;
import com.aisae.lms.user.Role;
import com.aisae.lms.user.User;
import com.aisae.lms.user.UserRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.HashMap;
import java.util.List;
import java.util.concurrent.atomic.AtomicInteger;
import java.util.concurrent.atomic.AtomicReference;
import org.junit.jupiter.api.Assertions;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Import;
import org.springframework.context.annotation.Primary;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.ResultActions;

/** Gestion 1 intégrée au backend du projet : authentification, profil, rôles et assistant. */
@SpringBootTest
@AutoConfigureMockMvc
@ActiveProfiles("test")
@Import(Gestion1IntegrationTest.StubAi.class)
class Gestion1IntegrationTest {

    static final AtomicInteger aiCalls = new AtomicInteger();
    static final AtomicReference<Boolean> aiDown = new AtomicReference<>(false);

    /** Fournisseur IA de test : le vrai fournisseur (Gemini) nécessite une clé et le réseau. */
    @TestConfiguration
    static class StubAi {
        @Bean
        @Primary
        AiClient stubAiClient() {
            return (system, history) -> {
                aiCalls.incrementAndGet();
                if (aiDown.get()) throw new AiClient.AiUnavailableException("down");
                return "Réponse à : " + history.get(history.size() - 1).text();
            };
        }
    }

    static final String ADMIN_EMAIL = "admin-test@test.local";
    static final String ADMIN_PASSWORD = "AdminPass123";

    @Autowired MockMvc mvc;
    @Autowired ObjectMapper json;
    @Autowired UserRepository users;
    @Autowired PasswordEncoder encoder;

    @BeforeEach
    void reset() {
        aiCalls.set(0);
        aiDown.set(false);
        if (!users.existsByEmail(ADMIN_EMAIL)) {
            User admin = new User();
            admin.setEmail(ADMIN_EMAIL);
            admin.setPasswordHash(encoder.encode(ADMIN_PASSWORD));
            admin.setFirstName("Admin");
            admin.setLastName("Test");
            admin.setRole(Role.ADMIN);
            users.save(admin);
        }
    }

    private static int counter = 0;

    private String uniqueEmail() {
        return "user" + (++counter) + "@test.local";
    }

    private ResultActions register(String email, String password) throws Exception {
        return mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(
                "{\"email\":\"" + email + "\",\"password\":\"" + password + "\",\"firstName\":\"Ines\",\"lastName\":\"Ben\"}"));
    }

    private String tokenOf(ResultActions r) throws Exception {
        return json.readTree(r.andReturn().getResponse().getContentAsString()).get("token").asText();
    }

    private String newStudentToken() throws Exception {
        return tokenOf(register(uniqueEmail(), "password123").andExpect(status().isOk()));
    }

    private String adminToken() throws Exception {
        return tokenOf(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + ADMIN_EMAIL + "\",\"password\":\"" + ADMIN_PASSWORD + "\"}")).andExpect(status().isOk()));
    }

    private ResultActions chat(String token, Long conv, String msg, String clientId) throws Exception {
        String body = json.writeValueAsString(new HashMap<String, Object>() {{
            put("conversationId", conv);
            put("message", msg);
            put("clientMessageId", clientId);
        }});
        return mvc.perform(post("/api/assistant/chat").header("Authorization", "Bearer " + token)
                .contentType(MediaType.APPLICATION_JSON).content(body));
    }

    // 1 + 8
    @Test
    void registerValidThenReadOwnProfile() throws Exception {
        String email = uniqueEmail();
        String token = tokenOf(register(email, "password123").andExpect(status().is2xxSuccessful())
                .andExpect(jsonPath("$.user.role").value("STUDENT"))
                .andExpect(jsonPath("$.user.passwordHash").doesNotExist()));
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.email").value(email))
                .andExpect(jsonPath("$.activity.conversations").value(0));
        mvc.perform(get("/api/auth/me").header("Authorization", "Bearer " + token))
                .andExpect(status().isOk()).andExpect(jsonPath("$.email").value(email));
    }

    @Test
    void registrationRoleChoice() throws Exception {
        String body = "{\"email\":\"%s\",\"password\":\"password123\",\"firstName\":\"A\",\"lastName\":\"B\",\"role\":\"%s\"}";
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body.formatted(uniqueEmail(), "TEACHER")))
                .andExpect(status().is2xxSuccessful()).andExpect(jsonPath("$.user.role").value("TEACHER"));
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body.formatted(uniqueEmail(), "ADMIN")))
                .andExpect(status().isForbidden());
        mvc.perform(post("/api/auth/register").contentType(MediaType.APPLICATION_JSON).content(body.formatted(uniqueEmail(), "NIMPORTE")))
                .andExpect(status().isBadRequest());
    }

    // 2
    @Test
    void registerInvalidIsRejected() throws Exception {
        register("pas-un-email", "123").andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.fieldErrors.email").exists())
                .andExpect(jsonPath("$.fieldErrors.password").exists());
    }

    // 3
    @Test
    void duplicateEmailIsConflictEvenWithDifferentCase() throws Exception {
        String email = uniqueEmail();
        register(email, "password123").andExpect(status().is2xxSuccessful());
        register(email.toUpperCase(), "password123").andExpect(status().isConflict());
    }

    // 4 + 5
    @Test
    void loginValidAndWrongPassword() throws Exception {
        String email = uniqueEmail();
        register(email, "password123").andExpect(status().is2xxSuccessful());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"password123\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.token", not(emptyString())));
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"mauvais-mot-de-passe\"}"))
                .andExpect(status().isUnauthorized());
        mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"inconnu@test.local\",\"password\":\"password123\"}"))
                .andExpect(status().isUnauthorized());
    }

    // 6
    @Test
    void privateEndpointsRequireAuthentication() throws Exception {
        mvc.perform(get("/api/users/me")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/assistant/conversations")).andExpect(status().isUnauthorized());
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer jeton.invalide.xyz"))
                .andExpect(status().isUnauthorized());
    }

    // 7
    @Test
    void studentCannotUseAdminEndpoints() throws Exception {
        String t = newStudentToken();
        mvc.perform(get("/api/users").header("Authorization", "Bearer " + t)).andExpect(status().isForbidden());
        mvc.perform(put("/api/users/1/role").header("Authorization", "Bearer " + t)
                .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"ADMIN\"}")).andExpect(status().isForbidden());
        mvc.perform(get("/api/users").header("Authorization", "Bearer " + adminToken()))
                .andExpect(status().isOk()).andExpect(jsonPath("$[0].avatar").doesNotExist());
    }

    // 9 : le rôle injecté dans la requête est ignoré, filière et niveau sont persistés côté serveur
    @Test
    void profileUpdateWorksAndCannotEscalateRole() throws Exception {
        String t = newStudentToken();
        String email = uniqueEmail();
        mvc.perform(put("/api/auth/profile").header("Authorization", "Bearer " + t).contentType(MediaType.APPLICATION_JSON)
                .content("{\"firstName\":\"Nour\",\"lastName\":\"Trabelsi\",\"email\":\"" + email + "\","
                        + "\"field\":\"Data & IA\",\"level\":\"Master 1\",\"role\":\"ADMIN\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.firstName").value("Nour"))
                .andExpect(jsonPath("$.role").value("STUDENT"));
        // l'e-mail est le sujet du jeton : on se reconnecte avec la nouvelle adresse
        String t2 = tokenOf(mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
                .content("{\"email\":\"" + email + "\",\"password\":\"password123\"}")).andExpect(status().isOk()));
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + t2))
                .andExpect(jsonPath("$.field").value("Data & IA"))
                .andExpect(jsonPath("$.level").value("Master 1"))
                .andExpect(jsonPath("$.role").value("STUDENT"));
        mvc.perform(get("/api/users").header("Authorization", "Bearer " + t2)).andExpect(status().isForbidden());
    }

    // 10
    @Test
    void cannotReadAnotherUsersProfile() throws Exception {
        String a = newStudentToken();
        String b = newStudentToken();
        long idB = json.readTree(mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + b))
                .andReturn().getResponse().getContentAsString()).get("id").asLong();
        mvc.perform(get("/api/users/" + idB).header("Authorization", "Bearer " + a)).andExpect(status().isForbidden());
        mvc.perform(get("/api/users/" + idB).header("Authorization", "Bearer " + b)).andExpect(status().isOk());
        mvc.perform(get("/api/users/" + idB).header("Authorization", "Bearer " + adminToken())).andExpect(status().isOk());
    }

    @Test
    void adminCanChangeRoleAndCannotChangeOwn() throws Exception {
        String student = newStudentToken();
        long studentId = json.readTree(mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + student))
                .andReturn().getResponse().getContentAsString()).get("id").asLong();
        String admin = adminToken();
        long adminId = json.readTree(mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + admin))
                .andReturn().getResponse().getContentAsString()).get("id").asLong();
        mvc.perform(put("/api/users/" + studentId + "/role").header("Authorization", "Bearer " + admin)
                .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"ADMIN\"}"))
                .andExpect(status().isOk()).andExpect(jsonPath("$.role").value("ADMIN"));
        // l'ancien jeton de la cible est invalidé par le changement de rôle
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + student)).andExpect(status().isUnauthorized());
        mvc.perform(put("/api/users/" + adminId + "/role").header("Authorization", "Bearer " + admin)
                .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"STUDENT\"}")).andExpect(status().isConflict());
    }

    @Test
    void passwordChangeAndLogout() throws Exception {
        String t = tokenOf(register(uniqueEmail(), "password123"));
        mvc.perform(put("/api/auth/password").header("Authorization", "Bearer " + t).contentType(MediaType.APPLICATION_JSON)
                .content("{\"current\":\"faux\",\"next\":\"nouveau-pass-1\"}")).andExpect(status().isBadRequest());
        mvc.perform(put("/api/auth/password").header("Authorization", "Bearer " + t).contentType(MediaType.APPLICATION_JSON)
                .content("{\"current\":\"password123\",\"next\":\"nouveau-pass-1\"}")).andExpect(status().isNoContent());
        mvc.perform(post("/api/auth/logout").header("Authorization", "Bearer " + t)).andExpect(status().isNoContent());
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + t)).andExpect(status().isUnauthorized());
    }

    @Test
    void avatarValidation() throws Exception {
        String t = newStudentToken();
        String png = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
        mvc.perform(put("/api/users/me/avatar").header("Authorization", "Bearer " + t).contentType(MediaType.APPLICATION_JSON)
                .content("{\"dataUrl\":\"" + png + "\"}")).andExpect(status().isOk())
                .andExpect(jsonPath("$.avatar").value(png));
        mvc.perform(put("/api/users/me/avatar").header("Authorization", "Bearer " + t).contentType(MediaType.APPLICATION_JSON)
                .content("{\"dataUrl\":\"data:image/svg+xml;base64,PHN2Zz48L3N2Zz4=\"}")).andExpect(status().isBadRequest());
        mvc.perform(put("/api/users/me/avatar").header("Authorization", "Bearer " + t).contentType(MediaType.APPLICATION_JSON)
                .content("{\"dataUrl\":\"data:image/png;base64,SGVsbG8gd29ybGQgbm90IGFuIGltYWdl\"}")).andExpect(status().isBadRequest());
        mvc.perform(delete("/api/users/me/avatar").header("Authorization", "Bearer " + t))
                .andExpect(status().isOk()).andExpect(jsonPath("$.avatar").doesNotExist());
    }

    // 11 + 12
    @Test
    void chatCreatesConversationAndPersistsMessages() throws Exception {
        String t = newStudentToken();
        ResultActions r = chat(t, null, "Explique la récursivité", "c-1").andExpect(status().isOk())
                .andExpect(jsonPath("$.reply.role").value("assistant"))
                .andExpect(jsonPath("$.reply.content").value("Réponse à : Explique la récursivité"));
        long conv = json.readTree(r.andReturn().getResponse().getContentAsString()).get("conversationId").asLong();
        chat(t, conv, "Un exemple ?", "c-2").andExpect(status().isOk());
        mvc.perform(get("/api/assistant/conversations/" + conv + "/messages").header("Authorization", "Bearer " + t))
                .andExpect(status().isOk()).andExpect(jsonPath("$", hasSize(4)))
                .andExpect(jsonPath("$[0].role").value("user")).andExpect(jsonPath("$[3].role").value("assistant"));
        mvc.perform(get("/api/assistant/conversations").header("Authorization", "Bearer " + t))
                .andExpect(jsonPath("$", hasSize(1))).andExpect(jsonPath("$[0].title").value("Explique la récursivité"));
        mvc.perform(get("/api/users/me").header("Authorization", "Bearer " + t))
                .andExpect(jsonPath("$.activity.conversations").value(1)).andExpect(jsonPath("$.activity.messages").value(4));
    }

    @Test
    void chatValidatesMessage() throws Exception {
        String t = newStudentToken();
        chat(t, null, "   ", null).andExpect(status().isBadRequest());
        chat(t, null, "x".repeat(2001), null).andExpect(status().isBadRequest());
    }

    @Test
    void replayedClientMessageIdDoesNotDuplicate() throws Exception {
        String t = newStudentToken();
        long conv = json.readTree(chat(t, null, "Bonjour", "dup-0").andReturn().getResponse().getContentAsString())
                .get("conversationId").asLong();
        int calls = aiCalls.get();
        chat(t, conv, "Question", "dup-1").andExpect(status().isOk());
        chat(t, conv, "Question", "dup-1").andExpect(status().isOk())
                .andExpect(jsonPath("$.reply.content").value("Réponse à : Question"));
        Assertions.assertEquals(calls + 1, aiCalls.get(), "un seul appel IA pour la requête rejouée");
        mvc.perform(get("/api/assistant/conversations/" + conv + "/messages").header("Authorization", "Bearer " + t))
                .andExpect(jsonPath("$", hasSize(4)));
    }

    // 13
    @Test
    void aiOutageReturns503AndRetryRecovers() throws Exception {
        String t = newStudentToken();
        aiDown.set(true);
        chat(t, null, "Bonjour", "r-0").andExpect(status().isServiceUnavailable());
        mvc.perform(get("/api/assistant/conversations").header("Authorization", "Bearer " + t))
                .andExpect(jsonPath("$", hasSize(0)));
        aiDown.set(false);
        long conv = json.readTree(chat(t, null, "Bonjour", "r-0").andExpect(status().isOk())
                .andReturn().getResponse().getContentAsString()).get("conversationId").asLong();
        aiDown.set(true);
        chat(t, conv, "Encore", "r-1").andExpect(status().isServiceUnavailable());
        aiDown.set(false);
        chat(t, conv, "Encore", "r-1").andExpect(status().isOk())
                .andExpect(jsonPath("$.reply.content").value("Réponse à : Encore"));
        mvc.perform(get("/api/assistant/conversations/" + conv + "/messages").header("Authorization", "Bearer " + t))
                .andExpect(jsonPath("$", hasSize(4)));
    }

    // 14
    @Test
    void conversationsAreIsolatedBetweenAccounts() throws Exception {
        String a = newStudentToken();
        String b = newStudentToken();
        long conv = json.readTree(chat(a, null, "Secret de A", "i-1").andReturn().getResponse().getContentAsString())
                .get("conversationId").asLong();
        mvc.perform(get("/api/assistant/conversations").header("Authorization", "Bearer " + b))
                .andExpect(jsonPath("$", hasSize(0)));
        mvc.perform(get("/api/assistant/conversations/" + conv + "/messages").header("Authorization", "Bearer " + b))
                .andExpect(status().isNotFound());
        chat(b, conv, "intrusion", "i-2").andExpect(status().isNotFound());
        mvc.perform(delete("/api/assistant/conversations/" + conv).header("Authorization", "Bearer " + b))
                .andExpect(status().isNotFound());
        mvc.perform(delete("/api/assistant/conversations/" + conv).header("Authorization", "Bearer " + a))
                .andExpect(status().isNoContent());
        mvc.perform(get("/api/assistant/conversations/" + conv + "/messages").header("Authorization", "Bearer " + a))
                .andExpect(status().isNotFound());
    }

    @Test
    void unconfiguredRealProviderReportsUnavailable() {
        // Sans clé, le client réel refuse proprement (aucune réponse simulée).
        GeminiClient gemini = new GeminiClient(new GeminiProperties("", "m", "", 1), new ObjectMapper());
        AiClient client = new GeminiAssistantClient(gemini);
        Assertions.assertThrows(AiClient.AiUnavailableException.class,
                () -> client.complete("sys", List.of(new AiClient.Turn(true, "salut"))));
    }
}
