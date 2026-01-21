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
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #ff7e21;">Stigao je novi zahtjev za trening! 🏓</h2>
                <p><strong>Igrač:</strong> ${player}</p>
                <p><strong>Datum:</strong> ${date}</p>
                <p><strong>Vrijeme:</strong> ${time}h</p>
                <hr />
                <p>Prijavi se u aplikaciju kako bi potvrdio ili odbio ovaj termin.</p>
                <a href="${process.env.NEXTAUTH_URL}/admin/availability" style="background: #39ff14; color: #000; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold;">Otvori Kalendar</a>
            </div>
        `
    }),
    bookingConfirmed: (date: string, time: string) => ({
        subject: "Tvoj termin je potvrđen! ✅",
        html: `
            <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
                <h2 style="color: #39ff14;">Spremite se za stol! 🏓</h2>
                <p>Tvoj zahtjev za trening je upravo <strong>potvrđen</strong>.</p>
                <p><strong>Datum:</strong> ${date}</p>
                <p><strong>Vrijeme:</strong> ${time}h</p>
                <hr />
                <p>Vidimo se u dvorani!</p>
            </div>
        `
    })
};
