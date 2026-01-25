import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_SERVER_USER,
        pass: process.env.EMAIL_SERVER_PASSWORD,
    },
});

export const sendBookingEmail = async (to: string, subject: string, html: string) => {
    try {
        await transporter.sendMail({
            from: `"PingPro 🏓" <${process.env.EMAIL_SERVER_USER}>`,
            to,
            bcc: "habijanecmarko@gmail.com",
            subject,
            html,
        });
        return { success: true };
    } catch (error) {
        console.error("Email send error:", error);
        return { success: false, error };
    }
};

export const templates = {
    newBookingRequest: (player: string, date: string, time: string) => ({
        subject: "Nova rezervacija na čekanju! 🔔",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                                <!-- Header with Logo -->
                                <tr>
                                    <td style="background: linear-gradient(135deg, #E30613 0%, #004B93 100%); padding: 40px 30px; text-align: center;">
                                        <img src="https://pingpro-eight.vercel.app/images/club-logo.jpg" alt="HSTK Velika Gorica" style="width: 80px; height: 80px; border-radius: 50%; border: 3px solid #39ff14; margin-bottom: 15px;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">Nova Rezervacija!</h1>
                                        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 16px;">HSTK Velika Gorica</p>
                                    </td>
                                </tr>
                                
                                <!-- Content -->
                                <tr>
                                    <td style="padding: 40px 30px;">
                                        <div style="background: rgba(57, 255, 20, 0.05); border-left: 4px solid #39ff14; padding: 20px; border-radius: 10px; margin-bottom: 30px;">
                                            <h2 style="color: #39ff14; margin: 0 0 15px 0; font-size: 20px;">🏓 Novi zahtjev za trening</h2>
                                            <p style="color: #ffffff; margin: 0; font-size: 16px; line-height: 1.6;">
                                                Igrač <strong style="color: #39ff14;">${player}</strong> je rezervirao termin i čeka tvoje odobrenje.
                                            </p>
                                        </div>
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom: 30px;">
                                            <tr>
                                                <td style="padding: 15px; background: rgba(255,255,255,0.03); border-radius: 10px; margin-bottom: 10px;">
                                                    <p style="color: rgba(255,255,255,0.6); margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Datum</p>
                                                    <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600;">${date}</p>
                                                </td>
                                            </tr>
                                            <tr><td style="height: 10px;"></td></tr>
                                            <tr>
                                                <td style="padding: 15px; background: rgba(255,255,255,0.03); border-radius: 10px;">
                                                    <p style="color: rgba(255,255,255,0.6); margin: 0 0 5px 0; font-size: 12px; text-transform: uppercase; letter-spacing: 1px;">Vrijeme</p>
                                                    <p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600;">${time}h</p>
                                                </td>
                                            </tr>
                                        </table>
                                        
                                        <table width="100%" cellpadding="0" cellspacing="0">
                                            <tr>
                                                <td align="center">
                                                    <a href="${process.env.NEXTAUTH_URL}/admin/availability" style="display: inline-block; background: linear-gradient(135deg, #39ff14 0%, #2dd60f 100%); color: #000000; padding: 16px 40px; text-decoration: none; border-radius: 12px; font-weight: 700; font-size: 16px; box-shadow: 0 10px 30px rgba(57, 255, 20, 0.3);">
                                                        📅 Otvori Kalendar
                                                    </a>
                                                </td>
                                            </tr>
                                        </table>
                                    </td>
                                </tr>
                                
                                <!-- Footer -->
                                <tr>
                                    <td style="padding: 30px; background: rgba(0,0,0,0.3); text-align: center; border-top: 1px solid rgba(255,255,255,0.1);">
                                        <p style="color: rgba(255,255,255,0.5); margin: 0; font-size: 14px;">
                                            PingPro - Sustav za rezervaciju treninga<br>
                                            HSTK Velika Gorica
                                        </p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `
    }),
    bookingConfirmed: (date: string, time: string, coachName?: string) => ({
        subject: "Tvoj termin je potvrđen! ✅",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #39ff14 0%, #2dd60f 100%); padding: 40px 30px; text-align: center;">
                                        <h1 style="color: #000000; margin: 0; font-size: 32px; font-weight: 700;">✅ Potvrđeno!</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 40px 30px; text-align: center;">
                                        <h2 style="color: #39ff14; margin: 0 0 20px 0; font-size: 24px;">Spremite se za stol! 🏓</h2>
                                        <p style="color: #ffffff; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                                            Tvoj zahtjev za trening je upravo <strong style="color: #39ff14;">potvrđen</strong>.
                                        </p>
                                        <div style="background: rgba(57, 255, 20, 0.1); border: 2px solid #39ff14; border-radius: 15px; padding: 25px; margin-bottom: 20px;">
                                            <p style="color: rgba(255,255,255,0.6); margin: 0 0 5px 0; font-size: 12px;">DATUM</p>
                                            <p style="color: #ffffff; margin: 0 0 15px 0; font-size: 20px; font-weight: 600;">${date}</p>
                                            <p style="color: rgba(255,255,255,0.6); margin: 0 0 5px 0; font-size: 12px;">VRIJEME</p>
                                            <p style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">${time}h</p>
                                            ${coachName ? `<p style="color: rgba(255,255,255,0.6); margin: 15px 0 5px 0; font-size: 12px;">TRENER</p><p style="color: #ffffff; margin: 0; font-size: 18px; font-weight: 600;">${coachName}</p>` : ''}
                                        </div>
                                        <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 14px;">Vidimo se u dvorani!</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `
    }),
    bookingReceived: (date: string, time: string) => ({
        subject: "Primili smo tvoju rezervaciju ⏳",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #333 0%, #111 100%); padding: 40px 30px; text-align: center;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">⏳ Rezervacija zaprimljena</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 40px 30px; text-align: center;">
                                        <p style="color: #ffffff; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                                            Tvoj upit za termin je zaprimljen i čeka potvrdu trenera. Javit ćemo ti se čim bude odobreno!
                                        </p>
                                        <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255,255,255,0.1); border-radius: 15px; padding: 25px;">
                                            <p style="color: rgba(255,255,255,0.6); margin: 0 0 5px 0; font-size: 12px;">DATUM I VRIJEME</p>
                                            <p style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 600;">${date} @ ${time}h</p>
                                        </div>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `
    }),
    bookingCancelled: (date: string, time: string, reason?: string) => ({
        subject: "Otkazan termin treninga ℹ️",
        html: `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="utf-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
            </head>
            <body style="margin: 0; padding: 0; background-color: #0a0a0a; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;">
                <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0a0a; padding: 40px 20px;">
                    <tr>
                        <td align="center">
                            <table width="600" cellpadding="0" cellspacing="0" style="background: linear-gradient(135deg, #1a1a1a 0%, #0d0d0d 100%); border-radius: 20px; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5);">
                                <tr>
                                    <td style="background: linear-gradient(135deg, #E30613 0%, #900 100%); padding: 40px 30px; text-align: center;">
                                        <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 700;">❌ Termin otkazan</h1>
                                    </td>
                                </tr>
                                <tr>
                                    <td style="padding: 40px 30px; text-align: center;">
                                        <p style="color: #ffffff; margin: 0 0 30px 0; font-size: 16px; line-height: 1.6;">
                                            Termin predviđen za <strong>${date}</strong> u <strong>${time}h</strong> je otkazan.
                                        </p>
                                        ${reason ? `<div style="background: rgba(227, 6, 19, 0.1); border: 1px solid #E30613; padding: 15px; border-radius: 10px; margin-bottom: 20px; color: #ff9999;">Razlog: ${reason}</div>` : ''}
                                        <p style="color: rgba(255,255,255,0.7); margin: 0; font-size: 14px;">Vidimo se nekom drugom prilikom!</p>
                                    </td>
                                </tr>
                            </table>
                        </td>
                    </tr>
                </table>
            </body>
            </html>
        `
    })
};
