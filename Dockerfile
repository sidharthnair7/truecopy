FROM node:22-alpine AS web
WORKDIR /web
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
RUN npm run build

FROM eclipse-temurin:25-jdk AS build
WORKDIR /app
COPY pom.xml mvnw ./
COPY .mvn .mvn
RUN chmod +x mvnw && ./mvnw -q -B dependency:go-offline
COPY src ./src
COPY --from=web /src/main/resources/static ./src/main/resources/static
RUN ./mvnw -q -B package -DskipTests

FROM eclipse-temurin:25-jre
WORKDIR /app
COPY --from=build /app/target/truecopy-*.jar app.jar
ENV PORT=8080
ENV RUNS_DIR=/data/runs
ENV TOKENS_DIR=/data/tokens
RUN mkdir -p /data/runs /data/tokens
EXPOSE 8080
CMD ["java", "-jar", "app.jar"]
