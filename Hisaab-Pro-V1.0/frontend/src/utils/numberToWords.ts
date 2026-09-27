export const convertAmountToBilingualWords = (amount: number | undefined | null): { english: string; arabic: string } => {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? Math.max(0, amount) : Math.max(0, Number(amount) || 0);

  const convertEnglish = (amt: number): string => {
    const units = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
    
    const num = Math.floor(amt);
    const fils = Math.round((amt - num) * 100);
    
    const helper = (n: number): string => {
      if (n <= 0 || isNaN(n)) return '';
      if (n < 20) return units[n] || '';
      if (n < 100) return tens[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + units[n % 10] : '');
      if (n < 1000) return units[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' and ' + helper(n % 100) : '');
      if (n < 1000000) return helper(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + helper(n % 1000) : '');
      if (n < 1000000000) return helper(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 !== 0 ? ' ' + helper(n % 1000000) : '');
      return n.toString();
    };
    
    const words = num === 0 ? 'Zero' : helper(num);
    const filsWords = fils > 0 ? ` and ${fils}/100 Fils` : '';
    return `${words} UAE Dirhams${filsWords} Only`;
  };

  const engWords = convertEnglish(safeAmount);

  return {
    english: engWords,
    arabic: ''
  };
};
