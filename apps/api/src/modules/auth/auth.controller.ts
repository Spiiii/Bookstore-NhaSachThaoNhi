import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  Post,
  Req,
  Res,
  UnauthorizedException,
  UseGuards,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiCookieAuth,
  ApiHeader,
  ApiNoContentResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import type { Request, Response } from 'express';
import { CurrentAdmin } from '../security/decorators/current-admin.decorator';
import { Public } from '../security/decorators/public.decorator';
import type { AuthenticatedAdmin } from '../security/types/security.types';
import { AccessTokenDto, AdminProfileDto, ChangePasswordDto, LoginDto } from './auth.dto';
import { AuthHttpPolicy } from './auth-http.policy';
import { AuthRequestGuard } from './auth-request.guard';
import { AuthService, type AuthTokens } from './auth.service';

@ApiTags('auth')
@Controller('auth')
@UseGuards(AuthRequestGuard)
@UsePipes(
  new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
    validationError: { target: false, value: false },
  }),
)
export class AuthController {
  constructor(
    private readonly auth: AuthService,
    private readonly http: AuthHttpPolicy,
  ) {}

  @Post('login')
  @ApiHeader({
    name: 'Origin',
    required: true,
    description: 'An explicitly trusted browser origin',
    schema: { type: 'string', format: 'uri' },
  })
  @Public()
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ type: AccessTokenDto })
  async login(
    @Body() input: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenDto> {
    return this.respond(response, await this.auth.login(input));
  }

  @Get('me')
  @ApiBearerAuth()
  @Header('Cache-Control', 'no-store')
  @ApiOkResponse({ type: AdminProfileDto })
  me(@CurrentAdmin() admin: AuthenticatedAdmin): AdminProfileDto {
    return this.auth.me(admin);
  }

  @Post('refresh')
  @ApiHeader({
    name: 'Origin',
    required: true,
    description: 'An explicitly trusted browser origin',
    schema: { type: 'string', format: 'uri' },
  })
  @Public()
  @HttpCode(200)
  @Header('Cache-Control', 'no-store')
  @ApiCookieAuth('__Secure-bookstore-refresh')
  @ApiOkResponse({ type: AccessTokenDto })
  async refresh(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AccessTokenDto> {
    try {
      return this.respond(response, await this.auth.refresh(this.http.readRefresh(request)));
    } catch (error) {
      if (error instanceof UnauthorizedException) this.http.clearRefresh(response);
      throw error;
    }
  }

  @Post('logout')
  @ApiHeader({
    name: 'Origin',
    required: true,
    description: 'An explicitly trusted browser origin',
    schema: { type: 'string', format: 'uri' },
  })
  @Public()
  @HttpCode(204)
  @Header('Cache-Control', 'no-store')
  @ApiOperation({
    summary: 'Idempotent logout using refresh cookie or access Bearer token',
    security: [{ '__Secure-bookstore-refresh': [] }, { bearer: [] }, {}],
  })
  @ApiNoContentResponse()
  async logout(
    @Req() request: Request,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    let refreshToken: string | undefined;
    try {
      refreshToken = this.http.readRefresh(request);
    } catch (error) {
      if (!(error instanceof UnauthorizedException)) throw error;
    }
    const verifiedRefresh = refreshToken ? await this.auth.logout(refreshToken, 'refresh') : false;
    if (!verifiedRefresh) {
      const accessToken =
        /^Bearer ([A-Za-z0-9_.-]+)$/i.exec(request.headers.authorization ?? '')?.[1] ?? '';
      await this.auth.logout(accessToken, 'access');
    }
    this.http.clearRefresh(response);
  }

  @Post('change-password')
  @ApiHeader({
    name: 'Origin',
    required: true,
    description: 'An explicitly trusted browser origin',
    schema: { type: 'string', format: 'uri' },
  })
  @HttpCode(204)
  @ApiBearerAuth()
  @Header('Cache-Control', 'no-store')
  @ApiBody({ type: ChangePasswordDto })
  @ApiNoContentResponse()
  async changePassword(
    @CurrentAdmin() admin: AuthenticatedAdmin,
    @Body() input: ChangePasswordDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<void> {
    await this.auth.changePassword(admin, input);
    this.http.clearRefresh(response);
  }

  private respond(response: Response, tokens: AuthTokens): AccessTokenDto {
    this.http.setRefresh(response, tokens.refreshToken, tokens.sessionExpiresAt);
    return { accessToken: tokens.accessToken, tokenType: 'Bearer' };
  }
}
