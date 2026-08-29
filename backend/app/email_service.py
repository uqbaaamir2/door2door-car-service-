from email.message import EmailMessage
import smtplib

from .config import settings


def send_password_reset_email(to_email: str, reset_token: str) -> None:
    reset_link = (
        f"http://localhost:8080/customer/reset-password?token={reset_token}"
    )

    message = EmailMessage()
    message["Subject"] = "MOTORMATE Password Reset"
    message["From"] = settings.mail_from
    message["To"] = to_email

    message.set_content(
        f"""
Hello,

You requested a password reset for your MOTORMATE account.

Click the link below to reset your password:

{reset_link}

This link expires in 30 minutes.

If you did not request this reset, please ignore this email.
"""
    )

    with smtplib.SMTP_SSL("smtp.gmail.com", 465) as smtp:
        smtp.login(
            settings.mail_username,
            settings.mail_password,
        )
        smtp.send_message(message)