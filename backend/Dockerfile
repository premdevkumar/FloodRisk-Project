# Multi-stage Dockerfile for Spring Boot Application
FROM eclipse-temurin:17-jdk-alpine AS builder
WORKDIR /workspace
COPY pom.xml .
COPY src ./src
# Build production fat JAR without running tests
RUN apk add --no-cache maven && mvn clean package -DskipTests

FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Run as non-privileged user for container security
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser:appgroup

COPY --from=builder /workspace/target/*.jar app.jar

EXPOSE 8080
ENV JAVA_OPTS="-XX:+UseG1GC -XX:MaxRAMPercentage=75.0"
ENTRYPOINT ["sh", "-c", "java $JAVA_OPTS -jar app.jar"]
