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
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserEmailLookupDto = exports.CasinoLookupDto = exports.PlayerRangeDto = exports.RoundLookupDto = void 0;
const class_transformer_1 = require("class-transformer");
const class_validator_1 = require("class-validator");
const GAME_RE = /^\d{10,24}$/;
const ROUND_RE = /^\d{10,}008$/;
const USER_RE = /^[A-Za-z0-9@._-]{6,128}$/;
const CASINO_RE = /^[A-Za-z0-9]{4,32}$/;
function trimToString(value) {
    return String(value ?? '').trim();
}
class RoundLookupDto {
    normalized() {
        return {
            roundId: this.roundId ?? this.RoundId,
            gameId: this.gameId ?? this.GameId,
            userId: this.userId ?? this.UserId,
        };
    }
}
exports.RoundLookupDto = RoundLookupDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => trimToString(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(ROUND_RE),
    __metadata("design:type", String)
], RoundLookupDto.prototype, "roundId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => trimToString(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(ROUND_RE),
    __metadata("design:type", String)
], RoundLookupDto.prototype, "RoundId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => trimToString(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(GAME_RE),
    __metadata("design:type", String)
], RoundLookupDto.prototype, "gameId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => trimToString(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(GAME_RE),
    __metadata("design:type", String)
], RoundLookupDto.prototype, "GameId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => trimToString(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(USER_RE),
    __metadata("design:type", String)
], RoundLookupDto.prototype, "userId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_transformer_1.Transform)(({ value }) => trimToString(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(USER_RE),
    __metadata("design:type", String)
], RoundLookupDto.prototype, "UserId", void 0);
class PlayerRangeDto {
}
exports.PlayerRangeDto = PlayerRangeDto;
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => trimToString(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(USER_RE),
    __metadata("design:type", String)
], PlayerRangeDto.prototype, "UserId", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], PlayerRangeDto.prototype, "StartTime", void 0);
__decorate([
    (0, class_validator_1.IsDateString)(),
    __metadata("design:type", String)
], PlayerRangeDto.prototype, "EndTime", void 0);
class CasinoLookupDto {
}
exports.CasinoLookupDto = CasinoLookupDto;
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => trimToString(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(CASINO_RE),
    __metadata("design:type", String)
], CasinoLookupDto.prototype, "casinoid", void 0);
class UserEmailLookupDto {
}
exports.UserEmailLookupDto = UserEmailLookupDto;
__decorate([
    (0, class_transformer_1.Transform)(({ value }) => trimToString(value)),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.Matches)(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/),
    __metadata("design:type", String)
], UserEmailLookupDto.prototype, "email", void 0);
//# sourceMappingURL=lookup.dto.js.map