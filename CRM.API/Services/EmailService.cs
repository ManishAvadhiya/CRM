using MailKit.Net.Smtp;
using MailKit.Security;
using MimeKit;

namespace CRM.API.Services;

public interface IEmailService
{
    Task<bool> SendEmailAsync(string toEmail, string subject, string body);
    Task<bool> SendNotificationEmailAsync(string toEmail, string notificationTitle, string notificationMessage);
}

public class EmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;

    public EmailService(IConfiguration configuration, ILogger<EmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<bool> SendEmailAsync(string toEmail, string subject, string body)
    {
        try
        {
            var emailSettings = _configuration.GetSection("EmailSettings");
            var smtpServer = emailSettings["SmtpServer"];
            var smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");
            var senderEmail = emailSettings["SenderEmail"];
            var senderName = emailSettings["SenderName"];
            var username = emailSettings["Username"];
            var password = emailSettings["Password"];
            var enableSsl = bool.Parse(emailSettings["EnableSsl"] ?? "true");

            var message = new MimeMessage();
            message.From.Add(new MailboxAddress(senderName, senderEmail));
            message.To.Add(new MailboxAddress("", toEmail));
            message.Subject = subject;

            var bodyBuilder = new BodyBuilder
            {
                HtmlBody = body
            };
            message.Body = bodyBuilder.ToMessageBody();

            using var client = new SmtpClient();
            await client.ConnectAsync(smtpServer, smtpPort, enableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None);
            await client.AuthenticateAsync(username, password);
            await client.SendAsync(message);
            await client.DisconnectAsync(true);

            _logger.LogInformation($"Email sent successfully to {toEmail}");
            return true;
        }
        catch (Exception ex)
        {
            _logger.LogError($"Error sending email: {ex.Message}");
            return false;
        }
    }

    public async Task<bool> SendNotificationEmailAsync(string toEmail, string notificationTitle, string notificationMessage)
    {
        var htmlBody = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
                    .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
                    .header {{ background-color: #4CAF50; color: white; padding: 20px; text-align: center; }}
                    .content {{ padding: 20px; background-color: #f9f9f9; }}
                    .footer {{ text-align: center; padding: 20px; font-size: 12px; color: #666; }}
                </style>
            </head>
            <body>
                <div class='container'>
                    <div class='header'>
                        <h2>{notificationTitle}</h2>
                    </div>
                    <div class='content'>
                        <p>{notificationMessage}</p>
                    </div>
                    <div class='footer'>
                        <p>This is an automated message from CRM System. Please do not reply.</p>
                    </div>
                </div>
            </body>
            </html>
        ";

        return await SendEmailAsync(toEmail, notificationTitle, htmlBody);
    }
}
