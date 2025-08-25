// reminder
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "kiras.serveriai.lt",
  port: 465,
  secure: true,
  auth: {
    user: "deividas@gpsmeistras.lt",
    pass: "W39Gnu9UE4V9EZz6",
  },
  tls: {
    rejectUnauthorized: false,
  },
});

export const sendReminderEmail = (email, subject, message) => {
  const mailOptions = {
    from: "deividas@gpsmeistras.lt",
    to: email,
    subject: subject,
    text: message,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log(error);
    } else {
      console.log("Laiskas issiustas: " + info.response);
    }
  });
};
