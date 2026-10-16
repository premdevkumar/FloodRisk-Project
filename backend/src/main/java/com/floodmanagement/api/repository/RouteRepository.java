package com.floodmanagement.api.repository;

import com.floodmanagement.api.entity.SosAlertEntity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Map;

@Repository
public interface RouteRepository extends JpaRepository<SosAlertEntity, Long> {

    @Query(value = "SELECT route.seq, route.path_seq as pathSeq, route.node, route.edge, route.cost, route.agg_cost as aggCost, ST_AsGeoJSON(r.geom) as geojson " +
                   "FROM pgr_dijkstra(" +
                   "    'SELECT id, source, target, " +
                   "     CASE WHEN :avoidFloods = true AND is_flooded = true THEN 999999.0 ELSE length_in_meters END as cost " +
                   "     FROM road_network', " +
                   "    :startId, :endId, false" +
                   ") as route " +
                   "JOIN road_network r ON route.edge = r.id", 
           nativeQuery = true)
    List<Map<String, Object>> calculateDynamicRouteRaw(
            @Param("startId") Long startId, 
            @Param("endId") Long endId, 
            @Param("avoidFloods") boolean avoidFloods);
}
