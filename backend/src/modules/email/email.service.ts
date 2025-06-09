import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import { Env } from '../../config/app.config';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromEmail: string;
  private readonly frontendUrl: string;

  constructor(private configService: ConfigService<Env>) {
    const apiKey = this.configService.get('RESEND_API_KEY', { infer: true });
    this.fromEmail = this.configService.get('RESEND_FROM_EMAIL', {
      infer: true,
    });
    this.frontendUrl = this.configService.get('FRONTEND_URL', { infer: true });

    this.resend = new Resend(apiKey);
  }

  async sendEmailVerification(email: string, token: string): Promise<boolean> {
    try {
      const verificationUrl = `${this.frontendUrl}/verify-email?token=${token}`;

      const { data, error } = await this.resend.emails.send({
        from: this.fromEmail,
        to: [email],
        subject: 'Vérification de votre adresse email',
        html: this.getEmailVerificationTemplate(verificationUrl),
      });

      if (error) {
        this.logger.error(`Erreur lors de l'envoi d'email à ${email}:`, error);
        return false;
      }

      this.logger.log(
        `Email de vérification envoyé à ${email}, ID: ${data?.id}`,
      );
      return true;
    } catch (error) {
      this.logger.error(
        `Erreur lors de l'envoi d'email de vérification à ${email}:`,
        error.message,
      );
      return false;
    }
  }

  private getEmailVerificationTemplate(verificationUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Vérification de votre email</title>
        </head>
        <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f5f5f5;">
          <div style="background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
            <h2 style="color: #333; text-align: center; margin-bottom: 30px;">
              Vérifiez votre adresse email
            </h2>
            
            <p style="color: #666; line-height: 1.6; margin-bottom: 25px;">
              Merci de vous être inscrit ! Pour finaliser la création de votre compte, 
              veuillez cliquer sur le bouton ci-dessous pour vérifier votre adresse email.
            </p>
            
            <div style="text-align: center; margin: 30px 0;">
              <a href="${verificationUrl}" 
                 style="background-color: #007bff; color: white; padding: 12px 30px; 
                        text-decoration: none; border-radius: 5px; display: inline-block;
                        font-weight: bold; transition: background-color 0.3s;">
                Vérifier mon email
              </a>
            </div>
            
            <p style="color: #666; line-height: 1.6; font-size: 14px;">
              Si le bouton ne fonctionne pas, vous pouvez copier et coller ce lien dans votre navigateur :
            </p>
            <p style="color: #007bff; word-break: break-all; font-size: 14px;">
              ${verificationUrl}
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;">
            
            <p style="color: #999; font-size: 12px; text-align: center;">
              Ce lien de vérification expirera dans 24 heures.<br>
              Si vous n'avez pas créé de compte, vous pouvez ignorer cet email.
            </p>
          </div>
        </body>
      </html>
    `;
  }
}
