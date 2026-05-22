"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
require("reflect-metadata");
const cookieParser = require("cookie-parser");
const common_1 = require("@nestjs/common");
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const corsOrigins = process.env.CORS_ORIGINS ?? '';
    const allowedOrigins = corsOrigins
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);
    app.enableCors({
        origin: allowedOrigins.length > 0 ? allowedOrigins : false,
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.use(cookieParser(process.env.COOKIE_SECRET));
    app.useGlobalPipes(new common_1.ValidationPipe({
        transform: true,
        whitelist: true,
        forbidNonWhitelisted: false,
    }));
    const port = Number(process.env.PORT);
    if (!Number.isFinite(port) || port <= 0) {
        throw new Error('PORT is not configured correctly');
    }
    await app.listen(port);
}
void bootstrap();
//# sourceMappingURL=main.js.map