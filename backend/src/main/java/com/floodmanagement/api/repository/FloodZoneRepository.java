package com.floodmanagement.api.repository;

import com.floodmanagement.api.entity.FloodZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface FloodZoneRepository extends JpaRepository<FloodZone, String> {

    List<FloodZone> findByStatus(String status);

    /**
     * Finds all flood zones within a given radius (in meters) from a reference point.
     * Uses PostGIS ST_DWithin for an index-accelerated spatial search.
     *
     * @param longitude center point longitude
     * @param latitude  center point latitude
     * @param radiusMeters search radius in meters
     * @return zones within the radius, ordered nearest-first
     */
    @Query(value = """
            SELECT * FROM flood_zones f
            WHERE ST_DWithin(
                f.location,
                ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326),
                :radiusMeters
            )
            ORDER BY ST_Distance(
                f.location,
                ST_SetSRID(ST_MakePoint(:longitude, :latitude), 4326)
            )
            """,
            nativeQuery = true)
    List<FloodZone> findZonesWithinRadius(
            @Param("longitude") double longitude,
            @Param("latitude") double latitude,
            @Param("radiusMeters") double radiusMeters);
}
