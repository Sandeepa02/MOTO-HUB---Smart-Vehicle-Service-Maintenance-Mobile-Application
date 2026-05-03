const Invoice = require('../models/Invoice');
const Booking = require('../models/Booking');
const fs = require('fs');
const path = require('path');

const TAX_RATE = 5;

const generateInvoiceNumber = () => {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `INV-${timestamp}-${random}`;
};

const calculateCosts = (baseAmount, discountAmount = 0) => {
  const afterDiscount = baseAmount - discountAmount;
  const taxAmount = Math.round(afterDiscount * (TAX_RATE / 100) * 100) / 100;
  const totalAmount = Math.round((afterDiscount + taxAmount) * 100) / 100;
  
  return {
    baseAmount,
    discountAmount,
    taxRate: TAX_RATE,
    taxAmount,
    totalAmount
  };
};

const generateInvoiceHTML = (invoice, booking, user, vehicle, serviceCenter) => {
  const invoiceDate = new Date(invoice.createdAt).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Invoice ${invoice.invoiceNumber}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; background: #f5f5f5; padding: 20px; }
    .invoice { max-width: 800px; margin: 0 auto; background: #fff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1); }
    .header { background: linear-gradient(135deg, #1E63D9 0%, #0E4FBF 100%); color: #fff; padding: 30px; }
    .header h1 { font-size: 28px; margin-bottom: 5px; }
    .header p { opacity: 0.9; }
    .invoice-meta { display: flex; justify-content: space-between; padding: 25px 30px; background: #f8fafc; border-bottom: 1px solid #e2e8f0; }
    .meta-block h3 { color: #64748b; font-size: 12px; text-transform: uppercase; margin-bottom: 5px; }
    .meta-block p { color: #1e293b; font-size: 14px; font-weight: 600; }
    .content { padding: 30px; }
    .section { margin-bottom: 25px; }
    .section-title { font-size: 14px; color: #64748b; text-transform: uppercase; margin-bottom: 10px; border-bottom: 2px solid #e2e8f0; padding-bottom: 5px; }
    .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; }
    .info-item label { display: block; font-size: 12px; color: #94a3b8; margin-bottom: 2px; }
    .info-item span { font-size: 14px; color: #1e293b; font-weight: 500; }
    .cost-table { width: 100%; border-collapse: collapse; margin-top: 15px; }
    .cost-table th, .cost-table td { padding: 12px 15px; text-align: left; border-bottom: 1px solid #e2e8f0; }
    .cost-table th { background: #f8fafc; color: #64748b; font-size: 12px; text-transform: uppercase; }
    .cost-table td { font-size: 14px; color: #1e293b; }
    .cost-table .amount { text-align: right; font-weight: 600; }
    .cost-table .total-row { background: #f0f9ff; }
    .cost-table .total-row td { font-size: 16px; font-weight: 700; color: #1E63D9; }
    .footer { background: #f8fafc; padding: 20px 30px; text-align: center; border-top: 1px solid #e2e8f0; }
    .footer p { color: #64748b; font-size: 12px; }
    .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: 600; }
    .status-completed { background: #dcfce7; color: #166534; }
    .thank-you { margin-top: 20px; padding: 15px; background: linear-gradient(135deg, #f0f9ff 0%, #e0f2fe 100%); border-radius: 8px; text-align: center; }
    .thank-you p { color: #0369a1; font-weight: 600; }
  </style>
</head>
<body>
  <div class="invoice">
    <div class="header">
      <h1>MOTO-HUB</h1>
      <p>Smart Vehicle Service & Maintenance</p>
    </div>
    
    <div class="invoice-meta">
      <div class="meta-block">
        <h3>Invoice Number</h3>
        <p>${invoice.invoiceNumber}</p>
      </div>
      <div class="meta-block">
        <h3>Invoice Date</h3>
        <p>${invoiceDate}</p>
      </div>
      <div class="meta-block">
        <h3>Service Date</h3>
        <p>${invoice.serviceDate}</p>
      </div>
      <div class="meta-block">
        <h3>Status</h3>
        <p><span class="status-badge status-completed">Completed</span></p>
      </div>
    </div>
    
    <div class="content">
      <div class="section">
        <h2 class="section-title">Customer Details</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>Customer Name</label>
            <span>${user?.name || 'N/A'}</span>
          </div>
          <div class="info-item">
            <label>Email</label>
            <span>${user?.email || 'N/A'}</span>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2 class="section-title">Vehicle Information</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>Vehicle</label>
            <span>${vehicle?.vehicleName || 'N/A'}</span>
          </div>
          <div class="info-item">
            <label>Registration</label>
            <span>${vehicle?.vehicleNumber || 'N/A'}</span>
          </div>
          <div class="info-item">
            <label>Brand / Model</label>
            <span>${vehicle?.brand || ''} ${vehicle?.model || ''}</span>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2 class="section-title">Service Center</h2>
        <div class="info-grid">
          <div class="info-item">
            <label>Center Name</label>
            <span>${serviceCenter?.centerName || 'N/A'}</span>
          </div>
          <div class="info-item">
            <label>Location</label>
            <span>${serviceCenter?.location || 'N/A'}</span>
          </div>
          <div class="info-item">
            <label>Contact</label>
            <span>${serviceCenter?.contactNumber || 'N/A'}</span>
          </div>
        </div>
      </div>
      
      <div class="section">
        <h2 class="section-title">Service & Cost Summary</h2>
        <table class="cost-table">
          <thead>
            <tr>
              <th>Description</th>
              <th class="amount">Amount (LKR)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoice.serviceName}</td>
              <td class="amount">${invoice.baseAmount.toFixed(2)}</td>
            </tr>
            ${invoice.additionalServices?.map(s => `
            <tr>
              <td>${s.name}</td>
              <td class="amount">${s.amount.toFixed(2)}</td>
            </tr>
            `).join('') || ''}
            ${invoice.discountAmount > 0 ? `
            <tr>
              <td>Discount</td>
              <td class="amount">-${invoice.discountAmount.toFixed(2)}</td>
            </tr>
            ` : ''}
            <tr>
              <td>Service Tax (${invoice.taxRate}%)</td>
              <td class="amount">${invoice.taxAmount.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td>Total Amount</td>
              <td class="amount">${invoice.totalAmount.toFixed(2)}</td>
            </tr>
          </tbody>
        </table>
      </div>
      
      ${booking.notes ? `
      <div class="section">
        <h2 class="section-title">Notes</h2>
        <p style="color: #64748b; font-size: 14px;">${booking.notes}</p>
      </div>
      ` : ''}
      
      <div class="thank-you">
        <p>Thank you for choosing MOTO-HUB!</p>
        <p style="font-weight: 400; margin-top: 5px;">We appreciate your business and look forward to serving you again.</p>
      </div>
    </div>
    
    <div class="footer">
      <p>This is a computer-generated invoice and does not require a signature.</p>
      <p style="margin-top: 5px;">For queries, please contact the service center directly.</p>
    </div>
  </div>
</body>
</html>
  `.trim();
};

const createInvoice = async (bookingId) => {
  const booking = await Booking.findById(bookingId)
    .populate('userId', 'name email phone')
    .populate('vehicleId', 'vehicleName vehicleNumber brand model')
    .populate('serviceCenterId', 'centerName location contactNumber')
    .populate('servicePackageId', 'serviceName price discountPrice');

  if (!booking) {
    throw new Error('Booking not found');
  }

  if (booking.status !== 'Completed') {
    throw new Error('Invoice can only be generated for completed bookings');
  }

  let existingInvoice = await Invoice.findOne({ bookingId });
  if (existingInvoice) {
    return existingInvoice;
  }

  const baseAmount = booking.servicePackageId?.price || booking.estimatedCost || 0;
  const discountAmount = booking.servicePackageId?.discountPrice 
    ? baseAmount - booking.servicePackageId.discountPrice 
    : 0;
  
  const costs = calculateCosts(baseAmount, discountAmount);
  const invoiceNumber = generateInvoiceNumber();

  const invoice = await Invoice.create({
    invoiceNumber,
    bookingId: booking._id,
    userId: booking.userId._id,
    serviceCenterId: booking.serviceCenterId._id,
    vehicleId: booking.vehicleId._id,
    serviceName: booking.serviceType,
    serviceDate: booking.bookingDate,
    ...costs,
    status: 'generated'
  });

  const invoicesDir = path.resolve(__dirname, '../../uploads/invoices');
  if (!fs.existsSync(invoicesDir)) {
    fs.mkdirSync(invoicesDir, { recursive: true });
  }

  const htmlContent = generateInvoiceHTML(
    invoice,
    booking,
    booking.userId,
    booking.vehicleId,
    booking.serviceCenterId
  );
  
  const htmlPath = path.join(invoicesDir, `${invoiceNumber}.html`);
  fs.writeFileSync(htmlPath, htmlContent);

  invoice.pdfPath = `/uploads/invoices/${invoiceNumber}.html`;
  await invoice.save();

  booking.invoiceNumber = invoiceNumber;
  booking.invoiceGeneratedAt = new Date();
  await booking.save();

  return invoice;
};

const getInvoiceByBooking = async (bookingId) => {
  return Invoice.findOne({ bookingId })
    .populate('userId', 'name email')
    .populate('vehicleId', 'vehicleName vehicleNumber')
    .populate('serviceCenterId', 'centerName');
};

module.exports = {
  createInvoice,
  getInvoiceByBooking,
  calculateCosts,
  TAX_RATE
};
