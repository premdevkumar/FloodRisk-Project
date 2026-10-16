package com.floodmanagement.api.kafka;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Declares partitioned Kafka topics for decoupled ingestion of sensor telemetry and citizen SOS events.
 */
@Configuration
public class KafkaTopicConfig {

    public static final String SOS_ALERTS_TOPIC = "sos-alerts";
    public static final String SENSOR_TELEMETRY_TOPIC = "sensor-telemetry";

    /**
     * Partitioned topic for citizen SOS dispatches (partitioned by citizenId).
     */
    @Bean
    public NewTopic sosAlertsTopic() {
        return TopicBuilder.name(SOS_ALERTS_TOPIC)
                .partitions(3)
                .replicas(1)
                .build();
    }

    /**
     * Partitioned topic for IoT water sensors and weather stations (partitioned by stationId).
     */
    @Bean
    public NewTopic sensorTelemetryTopic() {
        return TopicBuilder.name(SENSOR_TELEMETRY_TOPIC)
                .partitions(6)
                .replicas(1)
                .build();
    }
}
