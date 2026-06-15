type ResetEmailParams = {
  resetUrl: string;
  /** Durée de validité du lien, en minutes */
  expiresInMinutes?: number;
};

/**
 * Email de réinitialisation de mot de passe, aux couleurs E-Tontine.
 */
export function resetPasswordEmail({ resetUrl, expiresInMinutes = 60 }: ResetEmailParams): {
  subject: string;
  html: string;
  text: string;
} {
  const subject = "Réinitialisation de votre mot de passe E-Tontine";

  const text = [
    "Bonjour,",
    "",
    "Vous avez demandé à réinitialiser votre mot de passe E-Tontine.",
    `Cliquez sur ce lien pour choisir un nouveau mot de passe (valable ${expiresInMinutes} minutes) :`,
    resetUrl,
    "",
    "Si vous n'êtes pas à l'origine de cette demande, ignorez cet email.",
    "",
    "— L'équipe E-Tontine",
  ].join("\n");

  const html = `<!doctype html>
<html lang="fr">
  <body style="margin:0;padding:0;background-color:#f4fcf0;font-family:Inter,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4fcf0;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;border:1px solid #E2E8F0;">
            <tr>
              <td style="background-color:#006b2c;padding:24px 32px;">
                <span style="color:#ffffff;font-size:20px;font-weight:700;letter-spacing:-0.5px;">E-Tontine</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 12px;font-size:20px;color:#171d16;">Réinitialisez votre mot de passe</h1>
                <p style="margin:0 0 24px;font-size:15px;line-height:1.6;color:#3e4a3d;">
                  Vous avez demandé à réinitialiser votre mot de passe. Cliquez sur le bouton ci-dessous pour en choisir un nouveau.
                </p>
                <table role="presentation" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="border-radius:10px;background-color:#006b2c;">
                      <a href="${resetUrl}" target="_blank"
                        style="display:inline-block;padding:14px 28px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">
                        Choisir un nouveau mot de passe
                      </a>
                    </td>
                  </tr>
                </table>
                <p style="margin:24px 0 0;font-size:13px;line-height:1.6;color:#6e7b6c;">
                  Ce lien expire dans ${expiresInMinutes} minutes. Si vous n'êtes pas à l'origine de cette demande, vous pouvez ignorer cet email en toute sécurité.
                </p>
                <p style="margin:16px 0 0;font-size:12px;line-height:1.6;color:#6e7b6c;word-break:break-all;">
                  Si le bouton ne fonctionne pas, copiez ce lien :<br />
                  <a href="${resetUrl}" style="color:#006b2c;">${resetUrl}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#eff6ea;border-top:1px solid #E2E8F0;">
                <p style="margin:0;font-size:12px;color:#6e7b6c;">© ${new Date().getFullYear()} E-Tontine — La gestion moderne et transparente des tontines.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;

  return { subject, html, text };
}
