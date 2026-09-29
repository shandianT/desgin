// Group only the integer part. Keep exact decimal text and the user's in-progress input.
export function formatWanInput(value, info) {
  if (info?.userTyping) return info.input;
  if (value === null || value === undefined || value === '') return '';
  const raw = String(value);
  if (!/^\d+(?:\.\d*)?$/.test(raw)) return raw;
  const [whole, fraction] = raw.split('.');
  return whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',') + (fraction === undefined ? '' : `.${fraction}`);
}
