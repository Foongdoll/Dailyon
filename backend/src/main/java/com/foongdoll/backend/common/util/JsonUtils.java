package com.foongdoll.backend.common.util;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;

import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.Map;

@Slf4j
public final class JsonUtils {

    private static final ObjectMapper mapper = new ObjectMapper().findAndRegisterModules();

    private JsonUtils() {
    }

    public static String toJson(Map<String, Object> data) {
        if (data == null) {
            return "{}";
        }
        try {
            return mapper.writeValueAsString(data);
        } catch (JsonProcessingException e) {
            log.warn("Failed to serialize map to json: {}", e.getMessage());
            return "{}";
        }
    }

    @SuppressWarnings("unchecked")
    public static Map<String, Object> toMap(String json) {
        if (json == null || json.isBlank()) {
            return new LinkedHashMap<>();
        }
        try {
            return mapper.readValue(json, LinkedHashMap.class);
        } catch (JsonProcessingException e) {
            log.warn("Failed to deserialize json to map: {}", e.getMessage());
            return new LinkedHashMap<>();
        }
    }

    public static Map<String, Object> immutableCopy(Map<String, Object> data) {
        if (data == null || data.isEmpty()) {
            return Collections.emptyMap();
        }
        return Collections.unmodifiableMap(new LinkedHashMap<>(data));
    }
}
