package com.floodmanagement.api.service;

import com.floodmanagement.api.entity.SosAlertEntity;
import com.floodmanagement.api.model.SosAlert;
import com.floodmanagement.api.repository.SosAlertRepository;
import org.locationtech.jts.geom.Coordinate;
import org.locationtech.jts.geom.GeometryFactory;
import org.locationtech.jts.geom.Point;
import org.locationtech.jts.geom.PrecisionModel;
import org.springframework.stereotype.Service;

import java.util.List;

/**
 * Spatial service handling JTS Point creation and PostGIS persistence under WGS 84 (SRID 4326).
 * Note that JTS Coordinate takes (x=longitude, y=latitude) projection convention.
 */
@Service
public class SosLocationService {

    private final SosAlertRepository sosAlertRepository;
    private final GeometryFactory geometryFactory = new GeometryFactory(new PrecisionModel(), 4326);

    public SosLocationService(SosAlertRepository sosAlertRepository) {
        this.sosAlertRepository = sosAlertRepository;
    }

    public SosAlertEntity saveAlert(SosAlert alert) {
        Point alertLocation = geometryFactory.createPoint(new Coordinate(alert.longitude(), alert.latitude()));

        SosAlertEntity entity = new SosAlertEntity();
        entity.setCitizenId(alert.citizenId());
        entity.setLocation(alertLocation);
        entity.setDangerLevel(alert.dangerLevel());
        entity.setTimestamp(alert.timestamp());

        return sosAlertRepository.save(entity);
    }

    public List<SosAlertEntity> findAlertsNearLocation(double latitude, double longitude, double distanceInMeters) {
        return sosAlertRepository.findAlertsNearLocation(longitude, latitude, distanceInMeters);
    }
}
