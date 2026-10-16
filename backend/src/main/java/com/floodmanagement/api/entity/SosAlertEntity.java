package com.floodmanagement.api.entity;

import jakarta.persistence.*;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.locationtech.jts.geom.Point;

import java.time.Instant;

@Entity
@Table(name = "sos_alerts")
@Getter
@Setter
@NoArgsConstructor
public class SosAlertEntity {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String citizenId;

    @Column(columnDefinition = "geometry")
    private Point location;

    private int dangerLevel;

    private Instant timestamp;
}
