package com.floodmanagement.api.repository;

import com.floodmanagement.api.entity.SosAlertEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SosAlertRepository extends JpaRepository<SosAlertEntity, Long> {

    /**
     * Retrieves SOS alerts within a specified radius using spatial ST_DWithin distance filtering.
     */
    @Query(value = "SELECT * FROM sos_alerts s WHERE " +
                   "ST_DWithin(s.location, ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326), :distanceInMeters)", 
           nativeQuery = true)
    List<SosAlertEntity> findAlertsNearLocation(
            @Param("longitude") double longitude, 
            @Param("latitude") double latitude, 
            @Param("distanceInMeters") double distanceInMeters);
}
