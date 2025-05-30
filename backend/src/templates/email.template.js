export function getNotesReadyEmailTemplate({
  userName,
  subjectName,
  downloadUrl,
  historyPageUrl = 'https://pandaprepai.tech/history',
}) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>PandaPrep - Notes Ready</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      background-color: #f4f4f4;
      margin: 0;
      padding: 0;
    }
    .email-container {
      max-width: 600px;
      margin: 40px auto;
      background-color: #ffffff;
      padding: 30px;
      border-radius: 10px;
      box-shadow: 0 0 10px rgba(0,0,0,0.05);
      overflow: hidden;
    }
    .banner {
      width: 100%;
      display: block;
      border-radius: 10px 10px 0 0;
      margin: -30px -30px 20px -30px;
    }
    h1 {
      color: #1f2937;
      font-size: 24px;
      margin-bottom: 20px;
    }
    p {
      color: #4b5563;
      font-size: 16px;
      line-height: 1.6;
      margin-bottom: 16px;
    }
    .highlight {
      color: #111827;
      font-weight: bold;
    }
    .button {
      display: inline-block;
      padding: 12px 24px;
      background-color: #3b82f6;
      color: #ffffff;
      text-decoration: none;
      border-radius: 8px;
      font-weight: bold;
    }
    .button:hover {
      background-color: #2563eb;
    }
    .footer {
      margin-top: 30px;
      padding-top: 20px;
      border-top: 1px solid #e5e7eb;
      font-size: 14px;
      color: #9ca3af;
      text-align: center;
    }
  </style>
</head>
<body>

  <div class="email-container">
    <img 
      src="https://res.cloudinary.com/dlerie2z1/image/upload/f_auto,q_auto/fyq3z13npeot1fh8raeu" 
      alt="PandaPrep Banner" 
      class="banner" 
    />

    <h1>Your Notes Are Ready! 🎉</h1>
    
    <p>Hey ${userName},</p>
    
    <p>Great news! Your <span class="highlight">${subjectName}</span> notes have been successfully generated and are ready for download.</p>
    
    <p>You can access your notes in two ways:</p>
    
    <p>
      📚 <a href="${historyPageUrl}" target="_blank" rel="noopener noreferrer" class="highlight">View all your notes on your history page</a>
    </p>
    
    <p>
      📥 Or download directly using the link below:
    </p>
    
    <a 
      href="${downloadUrl}" 
      target="_blank" 
      rel="noopener noreferrer" 
      style="display:inline-block;margin-bottom:10px;padding:12px 24px;background-color:#3b82f6;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;"
    >
      Download ${subjectName} Notes
    </a>

    <p>If you have any feedback or run into any issues, we'd love to hear from you! Just drop us a message at <span class="highlight">support@pandaprepai.tech</span>.</p>
    
    <p>And if you found PandaPrep helpful, feel free to share it with your friends — we'd really appreciate it! 🚀</p>
    
    <a 
      href="https://www.pandaprepai.tech/contact" 
      target="_blank" 
      rel="noopener noreferrer"
      style="display:inline-block;padding:12px 24px;background-color:#3b82f6;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:bold;"
    >
      Contact Us
    </a>

    <p class="footer">
      Thanks for using PandaPrep — we're here to help you prep smarter!<br/>
      — Team PandaPrep ✨
    </p>
  </div>
</body>
</html>
  `;
}
