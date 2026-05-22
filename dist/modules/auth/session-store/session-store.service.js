"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SessionStoreService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SessionStoreService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const memory_session_store_1 = require("./memory-session.store");
const redis_session_store_1 = require("./redis-session.store");
let SessionStoreService = SessionStoreService_1 = class SessionStoreService {
    constructor(config, memoryStore, redisStore) {
        this.config = config;
        this.memoryStore = memoryStore;
        this.redisStore = redisStore;
        this.logger = new common_1.Logger(SessionStoreService_1.name);
        const configuredStore = (this.config.get('SESSION_STORE') || 'memory').trim().toLowerCase();
        if (configuredStore == 'redis') {
            this.activeStore = this.redisStore.isConfigured() ? this.redisStore : this.memoryStore;
            if (!this.redisStore.isConfigured()) {
                this.logger.warn('SESSION_STORE is set to redis but REDIS_URL is not configured. Falling back to memory store.');
            }
        }
        else {
            this.activeStore = this.memoryStore;
        }
        this.logger.log(`Using ${this.activeStore.kind} session store`);
    }
    kind() {
        return this.activeStore.kind;
    }
    get(token) {
        return this.activeStore.get(token);
    }
    set(session) {
        return this.activeStore.set(session);
    }
    delete(token) {
        return this.activeStore.delete(token);
    }
    touch(session, ttlMs) {
        return this.activeStore.touch(session, ttlMs);
    }
};
exports.SessionStoreService = SessionStoreService;
exports.SessionStoreService = SessionStoreService = SessionStoreService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        memory_session_store_1.MemorySessionStore,
        redis_session_store_1.RedisSessionStore])
], SessionStoreService);
//# sourceMappingURL=session-store.service.js.map