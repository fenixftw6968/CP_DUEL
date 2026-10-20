package CF_DuelProject.CF_DuelProject.config;

import java.util.Collections;
import java.util.List;

import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.MessagingException;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.stereotype.Component;

import org.springframework.context.annotation.Lazy;

import CF_DuelProject.CF_DuelProject.service.JwtService;
import CF_DuelProject.CF_DuelProject.service.MatchService;
import lombok.extern.slf4j.Slf4j;

/**
 * Authenticates STOMP clients with the same JWT used for the REST API.
 *
 * - CONNECT may carry an {@code Authorization: Bearer <jwt>} header; a valid token binds the session to that user.
 *   Connections without a (valid) token are still allowed so that read-only subscriptions keep working.
 * - SEND to application destinations ({@code /app/**}: chat, emotes, skip votes) requires an authenticated session,
 *   so the sender identity can never be supplied by the client.
 */
@Component
@Slf4j
public class WebSocketAuthInterceptor implements ChannelInterceptor {

    private static final String MATCH_TOPIC_PREFIX = "/topic/match/";

    private final JwtService jwtService;
    private final MatchService matchService;

    // @Lazy: MatchService itself uses the messaging template, so resolve it on first use to avoid a startup cycle
    public WebSocketAuthInterceptor(JwtService jwtService, @Lazy MatchService matchService) {
        this.jwtService = jwtService;
        this.matchService = matchService;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor = MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);
        if (accessor == null || accessor.getCommand() == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {
            List<String> headers = accessor.getNativeHeader("Authorization");
            if (headers != null && !headers.isEmpty()) {
                String header = headers.get(0);
                if (header != null && header.startsWith("Bearer ")) {
                    String token = header.substring(7);
                    try {
                        if (jwtService.isTokenValid(token)) {
                            String email = jwtService.extractEmail(token);
                            if (email != null) {
                                accessor.setUser(new UsernamePasswordAuthenticationToken(
                                        email, null, Collections.emptyList()));
                            }
                        }
                    } catch (Exception e) {
                        log.warn("WebSocket CONNECT with invalid token: {}", e.getMessage());
                    }
                }
            }
        } else if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            // Match topics carry players' private state (problems, scores, chat): participants only.
            if (destination != null && destination.startsWith(MATCH_TOPIC_PREFIX)) {
                String rest = destination.substring(MATCH_TOPIC_PREFIX.length());
                int slash = rest.indexOf('/');
                String identifier = slash >= 0 ? rest.substring(0, slash) : rest;
                if (accessor.getUser() == null || !matchService.canViewMatch(accessor.getUser().getName(), identifier)) {
                    throw new MessagingException("Not allowed to subscribe to this match");
                }
            }
        } else if (StompCommand.SEND.equals(accessor.getCommand())) {
            String destination = accessor.getDestination();
            if (destination != null && destination.startsWith("/app/") && accessor.getUser() == null) {
                throw new MessagingException("Authentication required to send messages");
            }
        }
        return message;
    }
}
