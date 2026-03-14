const nodemailer = require('nodemailer');
const emailConfig = require('../config/email.config');

class EmailService {
  constructor() {
    this.transporter = null;
    this.initTransporter();
  }

  initTransporter() {
    if (process.env.EMAIL_HOST && process.env.EMAIL_USER && process.env.EMAIL_PASSWORD) {
      this.transporter = nodemailer.createTransport({
        host: emailConfig.host,
        port: emailConfig.port,
        secure: emailConfig.secure,
        auth: {
          user: emailConfig.auth.user,
          pass: emailConfig.auth.pass
        }
      });
      console.log('✅ Transporter email inițializat');
    } else {
      console.log('⚠️  Configurație SMTP lipsă - email-urile vor fi simulate');
    }
  }

  async verifyConnection() {
    if (!this.transporter) {
      console.log('ℹ️  Transporter not initialized - running in simulation mode');
      return true;
    }

    try {
      await this.transporter.verify();
      console.log('✅ Conexiune SMTP funcțională');
      return true;
    } catch (error) {
      console.error('❌ Eroare conexiune SMTP:', error.message);
      return false;
    }
  }

  async sendVerificationEmail(userEmail, userName, verificationToken) {
    const verificationLinkDirect = `${emailConfig.frontendUrl}/verify-email/${verificationToken}`;
    
    const mailOptions = {
      from: `"Restaurant App" <${emailConfig.from}>`,
      to: userEmail,
      subject: '✅ Verifică-ți adresa de email - Restaurant App',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Verificare Email</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 40px 30px; text-align: center; }
            .header h1 { margin: 0; font-size: 24px; }
            .content { padding: 40px 30px; }
            .icon { font-size: 48px; text-align: center; margin: 20px 0; color: #4CAF50; }
            .button { display: inline-block; background: #4CAF50; color: white; text-decoration: none; padding: 15px 30px; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .button:hover { background: #45a049; }
            .token-box { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 15px; margin: 20px 0; font-family: monospace; word-break: break-all; }
            .footer { background: #f8f9fa; padding: 20px 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 15px; margin: 20px 0; color: #856404; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Verifică-ți adresa de email</h1>
            </div>
            
            <div class="content">
              <div class="icon">📧</div>
              
              <h2>Salut ${userName}!</h2>
              <p>Mulțumim că te-ai înregistrat pe <strong>Restaurant App</strong>!</p>
              <p>Pentru a-ți activa contul și a începe să folosești aplicația, te rugăm să verifici adresa de email.</p>
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${verificationLinkDirect}" class="button">
                  🔐 Verifică Email-ul
                </a>
              </div>
              
              <p>Dacă butonul nu funcționează, copiază și lipește acest link în browser:</p>
              <div class="token-box">
                ${verificationLinkDirect}
              </div>
              
              <div class="warning">
                <strong>⏰ Important:</strong> Acest link expiră în <strong>24 de ore</strong>.
                După expirare, va trebui să soliciți un link nou.
              </div>
              
              <p>Dacă nu ai creat acest cont, te rugăm să ignori acest email.</p>
              
              <p>Cu stimă,<br>
              <strong>Echipa Restaurant App</strong></p>
            </div>
            
            <div class="footer">
              <p>Acest email a fost trimis automat. Te rugăm să nu răspunzi.</p>
              <p>© ${new Date().getFullYear()} Restaurant App. Toate drepturile rezervate.</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        VERIFICARE EMAIL - RESTAURANT APP
        =================================
        
        Salut ${userName}!
        
        Mulțumim că te-ai înregistrat pe Restaurant App!
        
        Pentru a-ți activa contul, te rugăm să verifici adresa de email 
        accesând linkul de mai jos:
        
        ${verificationLinkDirect}
        
        Dacă linkul nu funcționează, copiază-l și lipește-l manual în browser.
        
        ⚠️ IMPORTANT: Link-ul expiră în 24 de ore.
        
        Dacă nu ai creat acest cont, te rugăm să ignori acest email.
        
        Cu stimă,
        Echipa Restaurant App
        
        ---
        Acest email a fost trimis automat.
        © ${new Date().getFullYear()} Restaurant App
      `
    };

    return await this.sendEmail(mailOptions);
  }

  async sendWelcomeEmail(userEmail, userName, authToken) {
    const loginLink = `${emailConfig.frontendUrl}/login`;
    const dashboardLink = `${emailConfig.frontendUrl}/dashboard`;
    
    const mailOptions = {
      from: `"Restaurant App" <${emailConfig.from}>`,
      to: userEmail,
      subject: '🎉 Bun venit la Restaurant App! Contul tău este acum activ.',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <style>
            body { font-family: Arial, sans-serif; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .success { color: #4CAF50; font-size: 24px; font-weight: bold; }
            .button { display: inline-block; padding: 12px 24px; background: #4CAF50; color: white; text-decoration: none; border-radius: 5px; }
          </style>
        </head>
        <body>
          <div class="container">
            <p class="success">✅ Cont verificat cu succes!</p>
            <h2>Bun venit, ${userName}!</h2>
            <p>Contul tău pe <strong>Restaurant App</strong> a fost verificat și este acum activ.</p>
            <p>Poți să te autentifici și să începi să folosești aplicația:</p>
            <p>
              <a href="${dashboardLink}" class="button">🏠 Accesează Dashboard-ul</a>
            </p>
            <p>Bucură-te de toate funcționalitățile aplicației noastre!</p>
            <br>
            <p>Cu drag,<br>Echipa Restaurant App</p>
          </div>
        </body>
        </html>
      `
    };

    return await this.sendEmail(mailOptions);
  }

  async sendPasswordResetEmail(userEmail, userName, resetToken) {
    const resetLink = `${emailConfig.frontendUrl}/reset-password/${encodeURIComponent(resetToken)}`;

    const mailOptions = {
      from: `"Restaurant App" <${emailConfig.from}>`,
      to: userEmail,
      subject: '🔑 Resetare parolă - Restaurant App',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Resetare parolă</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f7f9fc; }
            .container { max-width: 600px; margin: 0 auto; background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
            .header { background: linear-gradient(135deg, #4CAF50 0%, #45a049 100%); color: white; padding: 32px 30px; text-align: center; }
            .content { padding: 30px; }
            .button { display: inline-block; background: #4CAF50; color: white; text-decoration: none; padding: 12px 22px; border-radius: 6px; font-weight: bold; margin: 18px 0; }
            .token-box { background: #f8f9fa; border: 1px solid #dee2e6; border-radius: 5px; padding: 12px; margin: 16px 0; font-family: monospace; word-break: break-all; }
            .warning { background: #fff3cd; border: 1px solid #ffeaa7; border-radius: 5px; padding: 12px; margin: 16px 0; color: #856404; }
            .footer { background: #f8f9fa; padding: 16px 30px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Resetare parolă</h1>
            </div>
            <div class="content">
              <p>Salut ${userName || 'utilizator'}!</p>
              <p>Ai solicitat resetarea parolei contului tău.</p>
              <div style="text-align:center">
                <a class="button" href="${resetLink}">Resetează parola</a>
              </div>
              <p>Dacă butonul nu funcționează, folosește linkul de mai jos:</p>
              <div class="token-box">${resetLink}</div>
              <div class="warning"><strong>⏰ Important:</strong> Linkul expiră în curând. Dacă nu ai solicitat această acțiune, ignoră emailul.</div>
              <p>Cu stimă,<br><strong>Echipa Restaurant App</strong></p>
            </div>
            <div class="footer">Acest email a fost trimis automat.</div>
          </div>
        </body>
        </html>
      `,
      text: `Resetare parolă\n\nSalut ${userName || 'utilizator'}!\n\nFolosește linkul pentru a reseta parola:\n${resetLink}\n\nDacă nu ai solicitat, ignoră acest email.`
    };

    return await this.sendEmail(mailOptions);
  }

  async sendInvoiceEmail(userEmail, userName, invoice) {
    const items = Array.isArray(invoice?.items) ? invoice.items : [];
    const currency = invoice?.currency || 'MDL';

    const rowsHtml = items
      .map(
        (it) => `
          <tr>
            <td style="padding:8px 6px;border-bottom:1px solid #eee;">${it.name}</td>
            <td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:right;">${it.quantity}</td>
            <td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:right;">${Number(it.unitPrice).toFixed(2)} ${currency}</td>
            <td style="padding:8px 6px;border-bottom:1px solid #eee;text-align:right;">${Number(it.subtotal).toFixed(2)} ${currency}</td>
          </tr>
        `
      )
      .join('');

    const mailOptions = {
      from: `"Restaurant App" <${emailConfig.from}>`,
      to: userEmail,
      subject: `🧾 Factură comandă ${invoice?.orderNumber || ''} - Restaurant App`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Factură</title>
        </head>
        <body style="font-family: Arial, sans-serif; background:#f7f9fc; margin:0; padding:0;">
          <div style="max-width:700px; margin:0 auto; background:#fff; padding:24px;">
            <h2 style="margin:0 0 8px;">Factură</h2>
            <div style="color:#666; margin-bottom:18px;">Salut ${userName || 'utilizator'}!</div>

            <div style="margin-bottom:12px;">
              <strong>Comandă:</strong> ${invoice?.orderNumber || '-'}<br />
              <strong>Data:</strong> ${invoice?.date || '-'}<br />
              <strong>Adresă livrare:</strong> ${invoice?.shippingAddress || '-'}<br />
              <strong>Metodă plată:</strong> ${invoice?.paymentMethod || '-'}
            </div>

            <table style="width:100%; border-collapse: collapse;">
              <thead>
                <tr>
                  <th style="text-align:left; padding:8px 6px; border-bottom:2px solid #ddd;">Produs</th>
                  <th style="text-align:right; padding:8px 6px; border-bottom:2px solid #ddd;">Cantitate</th>
                  <th style="text-align:right; padding:8px 6px; border-bottom:2px solid #ddd;">Preț</th>
                  <th style="text-align:right; padding:8px 6px; border-bottom:2px solid #ddd;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${rowsHtml || '<tr><td colspan="4" style="padding:8px 6px;">(fără produse)</td></tr>'}
              </tbody>
            </table>

            <div style="text-align:right; margin-top:14px; font-size:16px;">
              <strong>Total:</strong> ${Number(invoice?.totalAmount || 0).toFixed(2)} ${currency}
            </div>

            <div style="color:#666; margin-top:22px; font-size:12px;">Acest email a fost generat automat.</div>
          </div>
        </body>
        </html>
      `,
      text: `Factura\n\nComanda: ${invoice?.orderNumber || '-'}\nTotal: ${Number(invoice?.totalAmount || 0).toFixed(2)} ${currency}`
    };

    return await this.sendEmail(mailOptions);
  }

  async sendAccountDeletedEmail(userEmail, userName) {
    const mailOptions = {
      from: `"Restaurant App" <${emailConfig.from}>`,
      to: userEmail,
      subject: '🗑️ Cont șters - Restaurant App',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1.0" />
          <title>Cont șters</title>
        </head>
        <body style="font-family: Arial, sans-serif; background:#f7f9fc; margin:0; padding:0;">
          <div style="max-width:650px; margin:0 auto; background:#fff; padding:24px;">
            <h2 style="margin:0 0 10px;">Cont șters</h2>
            <p>Salut ${userName || 'utilizator'}!</p>
            <p>Contul tău a fost șters la cerere.</p>
            <p>Dacă nu ai inițiat tu această acțiune, te rugăm să contactezi suportul.</p>
            <div style="color:#666; margin-top:18px; font-size:12px;">Acest email a fost trimis automat.</div>
          </div>
        </body>
        </html>
      `,
      text: `Salut ${userName || 'utilizator'}!\n\nContul tău a fost șters la cerere. Dacă nu ai inițiat tu această acțiune, contactează suportul.`
    };

    return await this.sendEmail(mailOptions);
  }

  async sendEmail(mailOptions) {
    if (!this.transporter) {
      console.log(`📧 [SIMULAT] Email către: ${mailOptions.to}`);
      console.log(`   Subiect: ${mailOptions.subject}`);
      console.log(`   Token: ${mailOptions.html?.includes('token=') ? 'Token inclus în link' : 'N/A'}`);
      
      if (mailOptions.html?.includes('verify-email')) {
        const tokenMatch = mailOptions.html.match(/\/verify-email\/([^\"<\s]+)/);
        if (tokenMatch) {
          const token = tokenMatch[1];
          console.log(`🔗 LINK DE VERIFICARE PENTRU TEST:`);
          console.log(`   ${emailConfig.frontendUrl}/verify-email/${token}`);
          console.log(`   ${emailConfig.appUrl}/verify-email/${token} (legacy redirect)`);
          console.log(`   ${emailConfig.appUrl}/auth/test-verification-link/${token}`);
        }
      }

      if (mailOptions.html?.includes('/reset-password/')) {
        const tokenMatch = mailOptions.html.match(/\/reset-password\/([^"<\s]+)/);
        if (tokenMatch) {
          const token = tokenMatch[1];
          console.log(`🔗 LINK RESETARE PAROLĂ PENTRU TEST:`);
          console.log(`   ${emailConfig.frontendUrl}/reset-password/${token}`);
        }
      }
      
      return {
        success: true,
        messageId: `simulated-${Date.now()}`,
        response: '250 2.0.0 OK (simulated)',
        simulated: true
      };
    }

    try {
      const info = await this.transporter.sendMail(mailOptions);
      console.log(`✅ Email trimis către ${mailOptions.to}`);
      return {
        success: true,
        messageId: info.messageId,
        response: info.response
      };
    } catch (error) {
      console.error(`❌ Eroare la trimiterea emailului către ${mailOptions.to}:`, error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }
}

module.exports = new EmailService();