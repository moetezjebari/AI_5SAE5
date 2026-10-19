package com.aisae.lms.assistant;

import com.aisae.lms.assistant.AssistantService.ChatResponse;
import com.aisae.lms.assistant.AssistantService.ConversationDto;
import com.aisae.lms.assistant.AssistantService.MessageDto;
import com.aisae.lms.user.User;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import java.util.List;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/assistant")
public class AssistantController {

    public record ChatRequest(
            Long conversationId,
            @NotBlank(message = "Message vide") @Size(max = 2000, message = "2000 caractères maximum") String message,
            @Size(max = 64) String clientMessageId) {}

    private final AssistantService service;

    public AssistantController(AssistantService service) {
        this.service = service;
    }

    @PostMapping("/chat")
    public ChatResponse chat(@AuthenticationPrincipal User me, @Valid @RequestBody ChatRequest req) {
        return service.chat(me.getId(), req.conversationId(), req.message(), req.clientMessageId());
    }

    @GetMapping("/conversations")
    public List<ConversationDto> conversations(@AuthenticationPrincipal User me) {
        return service.list(me.getId());
    }

    @GetMapping("/conversations/{id}/messages")
    public List<MessageDto> messages(@AuthenticationPrincipal User me, @PathVariable Long id) {
        return service.messages(me.getId(), id);
    }

    @DeleteMapping("/conversations/{id}")
    public ResponseEntity<Void> delete(@AuthenticationPrincipal User me, @PathVariable Long id) {
        service.delete(me.getId(), id);
        return ResponseEntity.noContent().build();
    }
}
