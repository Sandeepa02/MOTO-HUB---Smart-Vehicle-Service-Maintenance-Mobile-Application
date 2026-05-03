const MaintenanceRecord = require('../models/MaintenanceRecord');

const calculateHealthScore = async (vehicle) => {
  const currentYear = new Date().getFullYear();
  const vehicleAge = currentYear - vehicle.year;

  const records = await MaintenanceRecord.find({ vehicleId: vehicle._id }).sort({ serviceDate: -1 });

  let score = 100;
  const factors = [];

  // Factor 1: Mileage per year ratio (expected ~12,000-15,000 km/year)
  const mileagePerYear = vehicleAge > 0 ? vehicle.mileage / vehicleAge : vehicle.mileage;
  if (mileagePerYear > 20000) {
    score -= 15;
    factors.push({ factor: 'High mileage', impact: -15 });
  } else if (mileagePerYear > 15000) {
    score -= 8;
    factors.push({ factor: 'Above average mileage', impact: -8 });
  } else if (mileagePerYear < 5000 && vehicleAge > 1) {
    score -= 5;
    factors.push({ factor: 'Very low usage (may indicate issues)', impact: -5 });
  }

  // Factor 2: Vehicle age
  if (vehicleAge > 10) {
    score -= 15;
    factors.push({ factor: 'Vehicle over 10 years old', impact: -15 });
  } else if (vehicleAge > 7) {
    score -= 10;
    factors.push({ factor: 'Vehicle over 7 years old', impact: -10 });
  } else if (vehicleAge > 5) {
    score -= 5;
    factors.push({ factor: 'Vehicle over 5 years old', impact: -5 });
  }

  // Factor 3: Service frequency (expected 2-4 services per year)
  const servicesPerYear = vehicleAge > 0 ? records.length / vehicleAge : records.length;
  if (servicesPerYear < 1 && vehicleAge > 1) {
    score -= 20;
    factors.push({ factor: 'Infrequent servicing', impact: -20 });
  } else if (servicesPerYear < 2 && vehicleAge > 1) {
    score -= 10;
    factors.push({ factor: 'Below recommended service frequency', impact: -10 });
  } else if (servicesPerYear >= 2) {
    score += 5;
    factors.push({ factor: 'Regular servicing', impact: 5 });
  }

  // Factor 4: Time since last service
  if (records.length > 0) {
    const lastService = records[0].serviceDate;
    const daysSinceService = Math.floor((Date.now() - new Date(lastService)) / (1000 * 60 * 60 * 24));

    if (daysSinceService > 365) {
      score -= 15;
      factors.push({ factor: 'No service in over a year', impact: -15 });
    } else if (daysSinceService > 180) {
      score -= 8;
      factors.push({ factor: 'No service in 6+ months', impact: -8 });
    } else if (daysSinceService < 90) {
      score += 5;
      factors.push({ factor: 'Recently serviced', impact: 5 });
    }
  } else if (vehicleAge > 1) {
    score -= 15;
    factors.push({ factor: 'No service records found', impact: -15 });
  }

  // Factor 5: Insurance status
  if (vehicle.insuranceExpiry) {
    const daysUntilExpiry = Math.floor((new Date(vehicle.insuranceExpiry) - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) {
      score -= 10;
      factors.push({ factor: 'Insurance expired', impact: -10 });
    } else if (daysUntilExpiry < 30) {
      score -= 5;
      factors.push({ factor: 'Insurance expiring soon', impact: -5 });
    }
  }

  // Factor 6: Registration status
  if (vehicle.registrationExpiry) {
    const daysUntilExpiry = Math.floor((new Date(vehicle.registrationExpiry) - Date.now()) / (1000 * 60 * 60 * 24));
    if (daysUntilExpiry < 0) {
      score -= 10;
      factors.push({ factor: 'Registration expired', impact: -10 });
    } else if (daysUntilExpiry < 30) {
      score -= 5;
      factors.push({ factor: 'Registration expiring soon', impact: -5 });
    }
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Determine health status
  let status;
  if (score >= 80) status = 'Excellent';
  else if (score >= 60) status = 'Good';
  else if (score >= 40) status = 'Fair';
  else if (score >= 20) status = 'Poor';
  else status = 'Critical';

  return {
    score,
    status,
    factors,
    vehicleAge,
    mileagePerYear: Math.round(mileagePerYear),
    totalServices: records.length
  };
};

const getServiceSummary = async (vehicleId) => {
  const records = await MaintenanceRecord.find({ vehicleId }).sort({ serviceDate: -1 });

  if (records.length === 0) {
    return {
      totalServices: 0,
      totalSpent: 0,
      lastServiceDate: null,
      nextServiceDate: null
    };
  }

  const totalSpent = records.reduce((sum, record) => sum + (record.cost || 0), 0);
  const lastRecord = records[0];

  return {
    totalServices: records.length,
    totalSpent,
    lastServiceDate: lastRecord.serviceDate,
    nextServiceDate: lastRecord.nextServiceDate || null,
    lastServiceDescription: lastRecord.description
  };
};

module.exports = {
  calculateHealthScore,
  getServiceSummary
};
