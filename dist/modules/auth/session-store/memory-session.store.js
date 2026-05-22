"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MemorySessionStore = void 0;
const common_1 = require("@nestjs/common");
let MemorySessionStore = class MemorySessionStore {
    constructor() {
        this.kind = 'memory';
        this.sessions = new Map();
    }
    async get(token) {
        const session = this.sessions.get(token);
        return session ?? null;
    }
    async set(session) {
        this.sessions.set(session.token, session);
    }
    async delete(token) {
        this.sessions.delete(token);
    }
    async touch(session, ttlMs) {
        const now = Date.now();
        const updated = {
            ...session,
            lastActivityAt: now,
            expiresAt: now + ttlMs,
        };
        this.sessions.set(updated.token, updated);
        return updated;
    }
};
exports.MemorySessionStore = MemorySessionStore;
exports.MemorySessionStore = MemorySessionStore = __decorate([
    (0, common_1.Injectable)()
], MemorySessionStore);
//# sourceMappingURL=memory-session.store.js.map