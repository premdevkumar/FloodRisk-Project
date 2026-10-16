package com.floodmanagement.api.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;

@Entity
@Table(name = "flood_zones")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FloodZone {

    private static final GeometryFactory GEOMETRY_FACTORY =
            new GeometryFactory(new PrecisionModel(), 4326);

    @Id
    private String stationId;

    private String stationName;
    private String riverName;
    private String state;
    private double latitude;
    private double longitude;
    private double currentWaterLevelMeters;
    private double dangerLevelMeters;
    private String status;
    private int strandedResidents;
    private String lastUpdated;

    /**
     * PostGIS Point geometry synchronized from GPS latitude and longitude.
     */
    @Column(columnDefinition = "geometry")
    private Point location;

    @PrePersist
    @PreUpdate
    private void syncLocationFromCoordinates() {
        if (latitude != 0.0 || longitude != 0.0) {
            this.location = GEOMETRY_FACTORY.createPoint(new Coordinate(longitude, latitude));
        }
    }
}
