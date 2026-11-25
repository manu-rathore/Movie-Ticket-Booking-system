export const SNACKS_CATALOG = {
  'Caramel Popcorn': 180,
  'Chilled Pepsi (Large)': 120,
  'Cheesy Jalapeño Nachos': 160,
  'Crispy Veg Burger': 150,
};

export const PROMO_CODES = [
  {
    code: 'FIRST100',
    type: 'flat',
    value: 100,
    minAmount: 350,
    description: 'Flat ₹100 off on orders ₹350+',
  },
  {
    code: 'CINE20',
    type: 'percent',
    value: 20,
    maxDiscount: 150,
    minAmount: 200,
    description: '20% off (up to ₹150) on orders ₹200+',
  },
  {
    code: 'POPCORN50',
    type: 'flat',
    value: 50,
    minAmount: 250,
    description: 'Flat ₹50 off on tickets + snacks ₹250+',
  },
];

export function getSeatTier(seatLabel, basePrice) {
  const row = String(seatLabel || '').charAt(0).toUpperCase();
  if (row === 'G' || row === 'H') {
    return { tier: 'Platinum Recliner', surcharge: 120, price: basePrice + 120 };
  }
  if (['C', 'D', 'E', 'F'].includes(row)) {
    return { tier: 'Gold Executive', surcharge: 50, price: basePrice + 50 };
  }
  return { tier: 'Silver Classic', surcharge: 0, price: basePrice };
}

export function calculateSeatsTotal(seats, basePrice) {
  return (seats || []).reduce((sum, s) => sum + getSeatTier(s, basePrice).price, 0);
}

export function evaluatePromo(rawCode, subtotal) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) return { valid: false, discount: 0, message: 'Promo code empty hai' };

  const promo = PROMO_CODES.find((p) => p.code === code);
  if (!promo) return { valid: false, discount: 0, message: 'Invalid promo code' };

  if (subtotal < promo.minAmount) {
    return {
      valid: false,
      discount: 0,
      message: `Minimum order ₹${promo.minAmount} chahiye ${promo.code} ke liye`,
    };
  }

  let discount = promo.type === 'flat' ? promo.value : Math.round((subtotal * promo.value) / 100);
  if (promo.maxDiscount) discount = Math.min(discount, promo.maxDiscount);
  discount = Math.min(discount, subtotal);

  return {
    valid: true,
    code: promo.code,
    discount,
    description: promo.description,
    message: `${promo.code} applied! ₹${discount} saved`,
  };
}
