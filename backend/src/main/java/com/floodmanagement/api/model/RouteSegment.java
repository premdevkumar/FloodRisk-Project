package com.floodmanagement.api.model;

import java.io.Serializable;

public record RouteSegment(
    int seq,
    int pathSeq,
    long node,
    long edge,
    double cost,
    double aggCost,
    String geojson
) implements Serializable {}
