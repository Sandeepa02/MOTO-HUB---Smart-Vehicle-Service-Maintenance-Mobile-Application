const QRCode = require('qrcode');

const generateVehicleQRCode = async (vehicle) => {
  const qrData = JSON.stringify({
    vehicleId: vehicle._id.toString(),
    vehicleNumber: vehicle.vehicleNumber,
    vehicleName: vehicle.vehicleName,
    brand: vehicle.brand,
    model: vehicle.model,
    year: vehicle.year
  });

  const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
    width: 300,
    margin: 2,
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  });

  return qrCodeDataUrl;
};

const parseVehicleQRCode = (qrString) => {
  try {
    return JSON.parse(qrString);
  } catch {
    return null;
  }
};

module.exports = {
  generateVehicleQRCode,
  parseVehicleQRCode
};
