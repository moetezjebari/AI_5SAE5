package com.aisae.lms.user;

import com.aisae.lms.assistant.ChatMessageRepository;
import com.aisae.lms.assistant.ConversationRepository;
import com.aisae.lms.common.ApiException;
import java.util.Base64;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

/** Gestion 1 : profil détaillé, photo et administration des rôles (l'authentification reste dans AuthService). */
@Service
@Transactional
public class UserService {
    private static final long MAX_AVATAR_BYTES = 256 * 1024;

    private final UserRepository users;
    private final ConversationRepository conversations;
    private final ChatMessageRepository messages;

    public UserService(UserRepository users, ConversationRepository conversations, ChatMessageRepository messages) {
        this.users = users;
        this.conversations = conversations;
        this.messages = messages;
    }

    private User load(Long id) {
        return users.findById(id).orElseThrow(() -> ApiException.notFound("Utilisateur introuvable"));
    }

    @Transactional(readOnly = true)
    public UserProfileDto profile(Long id) {
        User u = load(id);
        return UserProfileDto.of(u, new UserProfileDto.Activity(conversations.countByUserId(id), messages.countByOwner(id)));
    }

    public UserProfileDto setAvatar(Long id, String dataUrl) {
        int comma = dataUrl.indexOf(',');
        if (comma < 0 || !dataUrl.substring(0, comma).matches("data:image/(png|jpeg|webp);base64")) {
            throw ApiException.badRequest("Format d'image non supporté (png, jpeg ou webp)");
        }
        byte[] bytes;
        try {
            bytes = Base64.getDecoder().decode(dataUrl.substring(comma + 1));
        } catch (IllegalArgumentException e) {
            throw ApiException.badRequest("Image invalide");
        }
        if (bytes.length > MAX_AVATAR_BYTES) {
            throw ApiException.badRequest("Image trop volumineuse (256 Ko maximum)");
        }
        if (!hasImageMagic(bytes)) {
            throw ApiException.badRequest("Le contenu ne correspond pas à une image");
        }
        load(id).setAvatar(dataUrl);
        return profile(id);
    }

    public UserProfileDto removeAvatar(Long id) {
        load(id).setAvatar(null);
        return profile(id);
    }

    @Transactional(readOnly = true)
    public List<UserProfileDto> listAll() {
        return users.findAll().stream().map(UserProfileDto::listItem).toList();
    }

    public UserProfileDto changeRole(Long actorId, Long targetId, Role role) {
        if (actorId.equals(targetId)) {
            throw ApiException.conflict("Vous ne pouvez pas modifier votre propre rôle");
        }
        User u = load(targetId);
        u.setRole(role);
        u.setTokenVersion(u.getTokenVersion() + 1); // les jetons existants de la cible deviennent invalides
        return UserProfileDto.listItem(u);
    }

    private static boolean hasImageMagic(byte[] b) {
        if (b.length < 12) return false;
        boolean png = (b[0] & 0xFF) == 0x89 && b[1] == 'P' && b[2] == 'N' && b[3] == 'G';
        boolean jpeg = (b[0] & 0xFF) == 0xFF && (b[1] & 0xFF) == 0xD8 && (b[2] & 0xFF) == 0xFF;
        boolean webp = b[0] == 'R' && b[1] == 'I' && b[2] == 'F' && b[3] == 'F' && b[8] == 'W' && b[9] == 'E' && b[10] == 'B' && b[11] == 'P';
        return png || jpeg || webp;
    }
}
