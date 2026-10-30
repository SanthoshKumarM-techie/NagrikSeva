export function generateTicketNumber(prefix = 'BLR') {
  const currentYear = new Date().getFullYear();
  const randomSuffix = Math.floor(1000 + Math.random() * 9000); // 4 digit random
  return `${prefix}-${currentYear}-${randomSuffix}`;
}

export default generateTicketNumber;

