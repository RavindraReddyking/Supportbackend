import { Transform } from 'class-transformer';
import { IsDateString, IsOptional, IsString, Matches } from 'class-validator';

const GAME_RE = /^\d{10,24}$/;
const ROUND_RE = /^\d{10,}008$/;
const USER_RE = /^[A-Za-z0-9@._-]{6,128}$/;
const CASINO_RE = /^[A-Za-z0-9]{4,32}$/;

function trimToString(value: unknown): string {
  return String(value ?? '').trim();
}

export class RoundLookupDto {
  @IsOptional()
  @Transform(({ value }) => trimToString(value))
  @IsString()
  @Matches(ROUND_RE)
  roundId?: string;

  @IsOptional()
  @Transform(({ value }) => trimToString(value))
  @IsString()
  @Matches(ROUND_RE)
  RoundId?: string;

  @IsOptional()
  @Transform(({ value }) => trimToString(value))
  @IsString()
  @Matches(GAME_RE)
  gameId?: string;

  @IsOptional()
  @Transform(({ value }) => trimToString(value))
  @IsString()
  @Matches(GAME_RE)
  GameId?: string;

  @IsOptional()
  @Transform(({ value }) => trimToString(value))
  @IsString()
  @Matches(USER_RE)
  userId?: string;

  @IsOptional()
  @Transform(({ value }) => trimToString(value))
  @IsString()
  @Matches(USER_RE)
  UserId?: string;

  normalized() {
    return {
      roundId: this.roundId ?? this.RoundId,
      gameId: this.gameId ?? this.GameId,
      userId: this.userId ?? this.UserId,
    };
  }
}

export class PlayerRangeDto {
  @Transform(({ value }) => trimToString(value))
  @IsString()
  @Matches(USER_RE)
  UserId!: string;

  @IsDateString()
  StartTime!: string;

  @IsDateString()
  EndTime!: string;
}

export class CasinoLookupDto {
  @Transform(({ value }) => trimToString(value))
  @IsString()
  @Matches(CASINO_RE)
  casinoid!: string;
}


export class UserEmailLookupDto {
  @Transform(({ value }) => trimToString(value))
  @IsString()
  @Matches(/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/)
  email!: string;
}
