FROM openjdk:17-jdk-alpine

WORKDIR /app

COPY target/KinConnect-0.0.1-SNAPSHOT.jar app.jar

VOLUME ["/data"]

EXPOSE 8080

ENTRYPOINT["java","-jar","app.jar"]