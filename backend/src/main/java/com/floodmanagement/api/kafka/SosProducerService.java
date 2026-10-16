package com.floodmanagement.api.kafka;

import com.floodmanagement.api.model.SosAlert;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Publishes citizen SOS alerts to Kafka partitioned by citizen ID to maintain sequential ordering.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class SosProducerService {

    private static final String TOPIC = "sos-alerts";
    private final KafkaTemplate<String, SosAlert> kafkaTemplate;

    public void publishSosAlert(SosAlert alert) {
        kafkaTemplate.send(TOPIC, alert.citizenId(), alert);
        log.info("SOS Alert published for citizen: {}", alert.citizenId());
    }
}
