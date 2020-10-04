import nodemailer from 'nodemailer'

export async function sendEmail(
  gmailUsername:string, gmailPassword:string,
  recipient:string,
  subject: string,
  body:string) {

  let transporter = nodemailer.createTransport({
      host: 'smtp.googlemail.com',
      port: 465,
      secure: true,
      auth: {
          user: gmailUsername,
          pass: gmailPassword,
      },
  });

  let info = await transporter.sendMail({
      from: gmailUsername,
      to: recipient,
      subject: subject,
      html: body
  });

  console.log('email sent', info);

  return info.messageId;
}
