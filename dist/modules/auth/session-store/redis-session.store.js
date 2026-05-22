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
var RedisSessionStore_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.RedisSessionStore = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const redis_1 = require("redis");
let RedisSessionStore = RedisSessionStore_1 = class RedisSessionStore {
    constructor(config) {
        this.config = config;
        this.kind = 'redis';
        this.logger = new common_1.Logger(RedisSessionStore_1.name);
        this.client = null;
        this.connectPromise = null;
    }
    isConfigured() {
        return Boolean(this.config.get('REDIS_URL'));
    }
    getPrefix() {
        return this.config.get('REDIS_SESSION_PREFIX', 'support-portal:session:');
    }
    getKey(token) {
        return `${this.getPrefix()}${token}`;
    }
    async getClient() {
        if (!this.client) {
            const url = this.config.get('REDIS_URL');
            if (!url) {
                throw new Error('REDIS_URL is not configured');
            }
            this.client = (0, redis_1.createClient)({ url });
            this.client.on('error', (error) => {
                this.logger.error(`Redis session store error: ${error instanceof Error ? error.message : String(error)}`);
            });
        }
        if (!this.client.isOpen) {
            this.connectPromise ??= this.client.connect().then(() => undefined).finally(() => {
                this.connectPromise = null;
            });
            await this.connectPromise;
        }
        return this.client;
    }
    async get(token) {
        const client = await this.getClient();
        const value = await client.get(this.getKey(token));
        if (!value)
            return null;
        return JSON.parse(value);
    }
    async set(session) {
        const client = await this.getClient();
        const ttlSeconds = Math.max(1, Math.ceil(Math.max(0, session.expiresAt - Date.now()) / 1000));
        await client.set(this.getKey(session.token), JSON.stringify(session), { EX: ttlSeconds });
    }
    async delete(token) {
        const client = await this.getClient();
        await client.del(this.getKey(token));
    }
    async touch(session, ttlMs) {
        const now = Date.now();
        const updated = {
            ...session,
            lastActivityAt: now,
            expiresAt: now + ttlMs,
        };
        await this.set(updated);
        return updated;
    }
    async onModuleDestroy() {
        if (this.client?.isOpen) {
            await this.client.quit();
        }
    }
};
exports.RedisSessionStore = RedisSessionStore;
exports.RedisSessionStore = RedisSessionStore = RedisSessionStore_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], RedisSessionStore);
//# sourceMappingURL=redis-session.store.js.map