export const fmtTokens = n => {
  if (n == null) return '--';
  if (n >= 1e9) return (n / 1e9).toFixed(2) + 'B';
  if (n >= 1e6) return (n / 1e6).toFixed(1) + 'M';
  if (n >= 1e3) return (n / 1e3).toFixed(1) + 'K';
  return String(n);
};

export const fmtUsd = n => n == null ? '--' : '$' + Number(n).toFixed(2);

export const fmtUsd4 = n => n == null ? '--' : '$' + Number(n).toFixed(4);

export const fmtPct = n => n == null ? '--' : Number(n).toFixed(1) + '%';

export const fmtMs = n => n == null ? '--' : Math.round(n) + 'ms';

export const shortModel = m =>
  m.replace('claude-', '').replace(/-\d{8}$/, '');
