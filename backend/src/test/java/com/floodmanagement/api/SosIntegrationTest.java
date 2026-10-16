package com.floodmanagement.api;

import com.floodmanagement.api.entity.SosAlertEntity;
import com.floodmanagement.api.kafka.SosProducerService;
import com.floodmanagement.api.model.SosAlert;
import com.floodmanagement.api.repository.SosAlertRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.kafka.core.KafkaTemplate;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;

@SpringBootTest
class SosIntegrationTest {

    @MockBean
    private KafkaTemplate<String, SosAlert> kafkaTemplate;

    @Autowired
    private SosProducerService producerService;

    @Autowired
    private SosAlertRepository alertRepository;

    @Test
    @DisplayName("Should publish SOS alert to Kafka topic")
    void testSosAlertPublish() {
        SosAlert alert = new SosAlert(
                "citizen-8921",
                13.0827,
                80.2707,
                3,
                Instant.now()
        );

        producerService.publishSosAlert(alert);

        verify(kafkaTemplate).send(eq("sos-alerts"), eq("citizen-8921"), any(SosAlert.class));
    }

    @Test
    @DisplayName("Should save SOS alert entity to repository")
    void testSosAlertPersistence() {
        GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);
        SosAlertEntity entity = new SosAlertEntity();
        entity.setCitizenId("citizen-8921");
        entity.setLocation(geometryFactory.createPoint(new org.locationtech.jts.geom.Coordinate(80.2707, 13.0827)));
        entity.setDangerLevel(3);
        entity.setTimestamp(Instant.now());

        SosAlertEntity saved = alertRepository.save(entity);
        assertNotNull(saved.getId(), "Saved SOS alert should have generated ID");
    }
}
