export function rupeesToPaisa(rupees: number): number {
  return Math.round(rupees * 100);
}

export function paisaToRupees(paisa: number): number {
  return paisa / 100;
}

export function formatINR(paisa: number): string {
  const isNegative = paisa < 0;
  const absPaisa = Math.abs(paisa);
  const rupees = Math.floor(absPaisa / 100);
  const paise = absPaisa % 100;

  const rupeesStr = rupees.toString();
  let formatted: string;

  if (rupeesStr.length <= 3) {
    formatted = rupeesStr;
  } else {
    const lastThree = rupeesStr.slice(-3);
    const remaining = rupeesStr.slice(0, -3);
    const groups: string[] = [];
    for (let i = remaining.length; i > 0; i -= 2) {
      groups.unshift(remaining.slice(Math.max(0, i - 2), i));
    }
    formatted = groups.join(',') + ',' + lastThree;
  }

  const result = `₹${formatted}.${paise.toString().padStart(2, '0')}`;
  return isNegative ? `-${result}` : result;
}

export function parseAmountToPaisa(amountStr: string): number {
  const cleaned = amountStr.replace(/[₹,\s]/g, '');
  const rupees = parseFloat(cleaned);
  if (isNaN(rupees)) {
    throw new Error(`Invalid amount: "${amountStr}"`);
  }
  return rupeesToPaisa(rupees);
}
