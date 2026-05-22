"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveRoundLookupMode = resolveRoundLookupMode;
exports.configureRoundLookupRequest = configureRoundLookupRequest;
const common_1 = require("@nestjs/common");
const sql = require("mssql");
function resolveRoundLookupMode(params) {
    const hasRoundId = Boolean(params.roundId);
    const hasGameAndUser = Boolean(params.gameId && params.userId);
    if (!hasRoundId && !hasGameAndUser) {
        throw new common_1.BadRequestException('Provide either RoundId or both GameId and UserId');
    }
    if (hasRoundId && (params.gameId || params.userId)) {
        throw new common_1.BadRequestException('Provide either RoundId only OR GameId and UserId only');
    }
    return hasRoundId ? 'RoundId' : 'GameIdUserId';
}
function configureRoundLookupRequest(request, params) {
    if (params.roundId) {
        return request.input('RoundId', sql.BigInt, params.roundId);
    }
    return request
        .input('GameId', sql.VarChar, params.gameId ?? '')
        .input('UserId', sql.VarChar, params.userId ?? '');
}
//# sourceMappingURL=round-lookup.js.map