/**
 * Generate HTML email template for order confirmation
 * @param {Object} order - Order object with items, totalAmount, etc.
 * @param {Object} user - User object with name, email
 * @returns {string} HTML email content
 */
export const orderConfirmationTemplate = (order, user) => {
  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(amount);
  };

  // Format date
  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Generate items HTML
  const itemsHtml = order.items
    .map(
      (item) => `
      <tr style="border-bottom: 1px solid #eee;">
        <td style="padding: 12px 0;">
          <strong>${escapeHtml(item.name)}</strong><br>
          <span style="color: #666; font-size: 14px;">Size: ${escapeHtml(item.size)}</span>
        </td>
        <td style="padding: 12px 0; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px 0; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 12px 0; text-align: right; font-weight: bold;">
          ${formatCurrency(item.price * item.quantity)}
        </td>
      </tr>
    `
    )
    .join("");

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
        <h1 style="color: white; margin: 0;">Order Confirmation</h1>
      </div>
      
      <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
        <p style="font-size: 16px;">Hi <strong>${escapeHtml(user.name)}</strong>,</p>
        <p>Thank you for your order! We've received your order and will begin processing it shortly.</p>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h2 style="margin-top: 0; color: #667eea;">Order Details</h2>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background: #f5f5f5; border-bottom: 2px solid #ddd;">
                <th style="padding: 12px; text-align: left;">Item</th>
                <th style="padding: 12px; text-align: center;">Qty</th>
                <th style="padding: 12px; text-align: right;">Price</th>
                <th style="padding: 12px; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="3" style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold;">
                  Total:
                </td>
                <td style="padding: 12px 0; text-align: right; font-size: 18px; font-weight: bold; color: #667eea;">
                  ${formatCurrency(order.totalAmount)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
        
        <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
          <h3 style="margin-top: 0; color: #667eea;">Order Information</h3>
          <p style="margin: 8px 0;"><strong>Order Number:</strong> ${escapeHtml(order.orderNumber || order._id.toString())}</p>
          <p style="margin: 8px 0;"><strong>Order Date:</strong> ${formatDate(order.createdAt)}</p>
          <p style="margin: 8px 0;"><strong>Status:</strong> <span style="color: #667eea; font-weight: bold;">${escapeHtml(order.status)}</span></p>
          ${order.shippingAddress ? `
            <p style="margin: 8px 0;"><strong>Shipping Address:</strong></p>
            <p style="margin: 4px 0; padding-left: 20px; color: #666;">
              ${escapeHtml(order.shippingAddress.street || "")}<br>
              ${escapeHtml(order.shippingAddress.city || "")}, ${escapeHtml(order.shippingAddress.state || "")} ${escapeHtml(order.shippingAddress.zipCode || "")}<br>
              ${escapeHtml(order.shippingAddress.country || "")}
            </p>
          ` : ""}
          ${order.paymentMethod ? `
            <p style="margin: 8px 0;"><strong>Payment Method:</strong> ${escapeHtml(order.paymentMethod)}</p>
          ` : ""}
        </div>
        
        <p style="margin-top: 30px;">We'll send you another email once your order has been shipped.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
          Thank you for shopping with us!<br>
          <strong>Clothing E-Commerce Team</strong>
        </p>
      </div>
    </body>
    </html>
  `;
};

/**
 * Escape HTML to prevent XSS attacks
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
const escapeHtml = (text) => {
  if (!text) return "";
  const map = {
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;",
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
};
  