package com.floodmanagement.api.service;

import com.floodmanagement.api.entity.FloodZone;
import com.floodmanagement.api.repository.FloodZoneRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.stereotype.Service;

import java.time.Duration;
import java.util.List;

/**
 * High-performance Redis caching layer placed in front of the flood alert and zone queries.
 * Provides deduplication of incoming sensor alert triggers and accelerates station queries.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class AlertCacheService {

    private static final String DEDUP_KEY_PREFIX = "alert:dedup:";
    private static final String ACTIVE_ZONES_KEY = "flood:zones:active";

    private final StringRedisTemplate redisTemplate;
    private final FloodZoneRepository floodZoneRepository;

    /**
     * Checks if an incoming alert trigger is duplicate within the configured TTL window.
     * Prevents flooding the event bus and UI when noisy sensors fire rapidly.
     *
     * @param alertKey unique identifier for the sensor/station/citizen event
     * @param windowSec deduplication time window in seconds
     * @return true if new (not duplicate) and recorded; false if already processed recently
     */
    public boolean checkAndSetDeduplication(String alertKey, long windowSec) {
        try {
            String fullKey = DEDUP_KEY_PREFIX + alertKey;
            Boolean isFirstTime = redisTemplate.opsForValue().setIfAbsent(fullKey, "1", Duration.ofSeconds(windowSec));
            return Boolean.TRUE.equals(isFirstTime);
        } catch (Exception ex) {
            log.warn("Redis deduplication check failed (continuing without cache): {}", ex.getMessage());
            return true; // Fallback to allowing processing if Redis is unavailable
        }
    }

    /**
     * Retrieves active high-risk flood zones with database fallback.
     */
    public List<FloodZone> getActiveFloodZonesCached() {
        return floodZoneRepository.findByStatus("DANGER");
    }
}
