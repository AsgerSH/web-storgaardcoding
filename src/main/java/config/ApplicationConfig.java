package config;

import io.javalin.Javalin;
import io.javalin.http.staticfiles.Location;

public final class ApplicationConfig {

    private ApplicationConfig() {
    }

    /** Build the Javalin app with static files + root route. */
    public static Javalin createApp() {
        Javalin app = Javalin.create(config -> {
            // Serve everything under src/main/resources/public as /
            config.staticFiles.add("/public", Location.CLASSPATH);
            config.showJavalinBanner = false;
        });

        // Ensure "/" serves the index.html
        app.get("/", ctx -> {
            ctx.contentType("text/html; charset=utf-8");
            ctx.result(ApplicationConfig.class.getResourceAsStream("/public/index.html"));
        });

        return app;
    }

    /** Start server on given port. Returns the running app (useful for tests/shutdown). */
    public static Javalin startServer(int port) {
        Javalin app = createApp();
        app.start(port);
        return app;
    }

    /** Optional convenience: start on PORT env or default 8080. */
    public static Javalin startFromEnv() {
        int port = Integer.parseInt(System.getenv().getOrDefault("PORT", "8080"));
        return startServer(port);
    }
}