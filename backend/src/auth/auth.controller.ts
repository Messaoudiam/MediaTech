// nestjs
import {
  Controller,
  Post,
  Body,
  Get,
  Req,
  Res,
  HttpStatus,
  UseGuards,
  Logger,
  HttpCode,
} from '@nestjs/common';
import { Response } from 'express';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { Public } from './decorators/public.decorator';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBody,
  ApiCookieAuth,
  ApiBearerAuth,
} from '@nestjs/swagger';

// services
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';

// dto & schemas
import { LoginUserDto } from '../users/dto/login-user.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import {
  AuthResponseDto,
  MessageResponseDto,
  ErrorResponseDto,
  UserResponseDto,
} from '../common/dto/api-response.dto';

@ApiTags('Authentification')
@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);

  constructor(
    private readonly authService: AuthService,
    private readonly usersService: UsersService,
  ) {
    this.logger.debug('AuthController initialisé');
    this.logger.log(
      'Routes disponibles: [POST] /auth/register, [POST] /auth/login, [POST] /auth/logout, [GET] /auth/profile, [GET] /auth/check-auth, [GET] /auth/test-cookies',
    );
  }

  @ApiOperation({
    summary: 'Inscription',
    description: 'Permet de créer un compte utilisateur',
  })
  @ApiBody({ type: CreateUserDto })
  @ApiResponse({
    status: 201,
    description: 'Inscription réussie',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Données invalides',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 409,
    description: 'Email déjà utilisé',
    type: ErrorResponseDto,
  })
  @Public()
  @Post('register')
  async register(
    @Body() registerDto: CreateUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      this.logger.log(`Tentative d'inscription pour: ${registerDto.email}`);

      // Logs de débogage simplifiés
      this.logger.debug(`Traitement de la demande d'inscription`);

      const user = await this.authService.register(
        registerDto.email,
        registerDto.password,
      );

      const tokens = await this.authService.generateTokens(user);

      // Set cookies
      this.authService.setAccessTokenCookie(response, tokens.accessToken);
      this.authService.setRefreshTokenCookie(response, tokens.refreshToken);

      this.logger.log(`Inscription réussie pour: ${registerDto.email}`);
      return {
        message: 'Inscription réussie',
        user: {
          id: user.id,
          email: user.email,
        },
      };
    } catch (error) {
      this.logger.error(
        `Échec de l'inscription pour ${registerDto.email}: ${error.message}`,
        error.stack,
      );

      // Gérer les erreurs spécifiques
      if (error.message === 'Cet email est déjà utilisé') {
        return response.status(HttpStatus.CONFLICT).json({
          message: error.message,
        });
      }

      // Réponse générique pour les autres erreurs
      return response.status(HttpStatus.BAD_REQUEST).json({
        message:
          error.message || "Une erreur est survenue lors de l'inscription",
      });
    }
  }

  @ApiOperation({
    summary: 'Connexion',
    description: 'Permet de se connecter avec email et mot de passe',
  })
  @ApiBody({ type: LoginUserDto })
  @ApiResponse({
    status: 200,
    description: 'Connexion réussie',
    type: AuthResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Identifiants invalides',
    type: ErrorResponseDto,
  })
  @Public()
  @HttpCode(HttpStatus.OK)
  @Post('login')
  async login(
    @Body() loginDto: LoginUserDto,
    @Res({ passthrough: true }) response: Response,
  ) {
    try {
      this.logger.log(`Tentative de connexion pour: ${loginDto.email}`);

      // Logs de débogage simplifiés
      this.logger.debug(
        `Traitement de la demande de connexion directe (sans Passport)`,
      );

      // Appel direct du service au lieu de passer par le PassportStrategy
      const user = await this.authService.validateUser(
        loginDto.email,
        loginDto.password,
      );

      this.logger.log(`Connexion réussie pour: ${loginDto.email}`);

      const tokens = await this.authService.generateTokens(user);

      // Set cookies
      this.authService.setAccessTokenCookie(response, tokens.accessToken);
      this.authService.setRefreshTokenCookie(response, tokens.refreshToken);

      return {
        message: 'Connexion réussie',
        user: {
          id: user.id,
          email: user.email,
          nom: user.nom,
          prenom: user.prenom,
          role: user.role,
        },
      };
    } catch (error) {
      this.logger.error(
        `Échec de connexion pour ${loginDto.email}: ${error.message}`,
        error.stack,
      );

      // Gérer les différents types d'erreurs
      if (error.message.includes('verrouillé')) {
        return response.status(HttpStatus.UNAUTHORIZED).json({
          message: error.message,
        });
      }

      // Erreur générique d'authentification
      return response.status(HttpStatus.UNAUTHORIZED).json({
        message: 'Email ou mot de passe incorrect',
      });
    }
  }

  @ApiOperation({
    summary: 'Déconnexion',
    description: 'Permet de se déconnecter',
  })
  @ApiResponse({
    status: 200,
    description: 'Déconnexion réussie',
    type: MessageResponseDto,
  })
  @ApiCookieAuth()
  @Post('logout')
  async logout(@Res() response: Response) {
    this.logger.debug('Endpoint /auth/logout appelé');
    // Supprimer les cookies
    response.clearCookie('access_token');
    response.clearCookie('refresh_token');
    // S'assurer aussi de supprimer les anciens noms de cookies par prudence
    response.clearCookie('accessToken');
    response.clearCookie('refreshToken');

    this.logger.log('Déconnexion réussie, cookies supprimés');
    return response.status(HttpStatus.OK).json({
      message: 'Déconnexion réussie',
    });
  }

  @ApiOperation({
    summary: 'Profil utilisateur',
    description: 'Récupère les informations du profil utilisateur connecté',
  })
  @ApiResponse({
    status: 200,
    description: 'Profil récupéré avec succès',
    type: UserResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
    type: ErrorResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Utilisateur non trouvé',
    type: ErrorResponseDto,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('profile')
  async getProfile(@Req() request: any, @Res() response: Response) {
    this.logger.debug('Endpoint /auth/profile appelé');
    try {
      // L'ID utilisateur est maintenant disponible dans request.user.id grâce au JwtStrategy
      const userId = request.user.id;

      this.logger.log('Récupération du profil pour userId:', userId);

      const user = await this.usersService.findOneUser(userId);

      if (!user) {
        this.logger.warn('Utilisateur non trouvé avec ID:', userId);
        return response.status(HttpStatus.NOT_FOUND).json({
          message: 'Utilisateur non trouvé',
        });
      }

      this.logger.debug('Profil utilisateur récupéré avec succès');
      return response.status(HttpStatus.OK).json(user);
    } catch (error) {
      this.logger.error('Erreur lors de la récupération du profil:', error);
      return response.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        message: 'Erreur lors de la récupération du profil',
      });
    }
  }

  @ApiOperation({
    summary: 'Vérifier authentification',
    description: "Vérifie si l'utilisateur est authentifié",
  })
  @ApiResponse({ status: 200, description: 'Utilisateur authentifié' })
  @ApiResponse({
    status: 401,
    description: 'Non authentifié',
    type: ErrorResponseDto,
  })
  @ApiBearerAuth('access-token')
  @UseGuards(JwtAuthGuard)
  @Get('check-auth')
  async checkAuth(@Req() request: any, @Res() response: Response) {
    this.logger.debug('Endpoint /auth/check-auth appelé');
    this.logger.debug('Utilisateur authentifié:', request.user);
    return response.status(HttpStatus.OK).json(true);
  }

  // Endpoint de test pour vérifier les cookies - SANS GUARD pour le debug
  @ApiOperation({
    summary: 'Test des cookies',
    description: 'Route de test pour vérifier la configuration des cookies',
  })
  @ApiResponse({
    status: 200,
    description: 'Test réussi avec mock data',
    type: UserResponseDto,
  })
  @Get('test-cookies')
  async testCookies(@Req() request, @Res() response: Response) {
    this.logger.debug('Endpoint /auth/test-cookies appelé');
    this.logger.log('Headers de la requête:', request.headers);
    this.logger.log('Cookies de la requête:', request.cookies);

    // Créer un cookie de test
    response.cookie('test-cookie', 'test-value', {
      httpOnly: true,
      maxAge: 60 * 1000, // 1 minute
    });

    // Retourner un utilisateur de test pour le debug
    const mockUser = {
      id: '1234',
      email: 'test@example.com',
      nom: 'Utilisateur',
      prenom: 'Test',
      role: 'user',
    };

    this.logger.debug(
      "Réponse envoyée avec l'utilisateur test et cookie configuré",
    );
    return response.status(HttpStatus.OK).json(mockUser);
  }
}
