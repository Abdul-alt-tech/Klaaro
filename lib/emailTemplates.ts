function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export function statusChangedEmail(params: {
  ticketTitle: string
  newStatus: string
  recipientName: string
  ticketUrl: string
}): { subject: string; html: string } {
  const ticketTitle = escapeHtml(params.ticketTitle)
  const newStatus = escapeHtml(params.newStatus)
  const recipientName = escapeHtml(params.recipientName)
  const ticketUrl = escapeHtml(params.ticketUrl)

  return {
    subject: `Your ticket "${params.ticketTitle}" is now ${params.newStatus}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; padding: 24px;">
        <p>Hi ${recipientName},</p>
        <p>Your ticket <strong>${ticketTitle}</strong> is now <strong>${newStatus}</strong>.</p>
        <p>
          <a href="${ticketUrl}" style="display: inline-block; background: #059669; color: #ffffff; padding: 10px 16px; text-decoration: none; border-radius: 4px;">View ticket</a>
        </p>
        <p>Best,<br />The Klaaro Team</p>
      </div>
    `,
  }
}

export function newTicketEmail(params: {
  ticketTitle: string
  category: string
  priority: string
  submittedByName: string
  ticketUrl: string
}): { subject: string; html: string } {
  const ticketTitle = escapeHtml(params.ticketTitle)
  const category = escapeHtml(params.category)
  const priority = escapeHtml(params.priority)
  const submittedByName = escapeHtml(params.submittedByName)
  const ticketUrl = escapeHtml(params.ticketUrl)

  return {
    subject: `New ticket submitted: ${params.ticketTitle}`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; padding: 24px;">
        <p>Hi,</p>
        <p>A new ticket has been submitted and is ready to be reviewed.</p>
        <p><strong>Title:</strong> ${ticketTitle}</p>
        <p><strong>Category:</strong> ${category}</p>
        <p><strong>Priority:</strong> ${priority}</p>
        <p><strong>Submitted by:</strong> ${submittedByName}</p>
        <p>
          <a href="${ticketUrl}" style="display: inline-block; background: #059669; color: #ffffff; padding: 10px 16px; text-decoration: none; border-radius: 4px;">View and claim ticket</a>
        </p>
        <p>Best,<br />The Klaaro Team</p>
      </div>
    `,
  }
}
