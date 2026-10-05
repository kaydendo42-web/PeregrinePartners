import type {BillingRecord} from './types.ts';
export function currencyDigits(currency:string):number{if(!/^[A-Z]{3}$/.test(currency))throw new Error('Use a three-letter currency code.');return new Intl.NumberFormat('en-AU',{style:'currency',currency}).resolvedOptions().maximumFractionDigits??2;}
export function parseMinor(value:string,currency:string):number{
 const digits=currencyDigits(currency);if(!/^\d+(\.\d+)?$/.test(value))throw new Error('Enter a positive amount without commas.');const [whole,fraction='']=value.split('.');if(fraction.length>digits)throw new Error(`Use at most ${digits} decimal places for ${currency}.`);
 const minor=BigInt(whole)*BigInt(10)**BigInt(digits)+BigInt(fraction.padEnd(digits,'0')||'0');if(minor>BigInt(Number.MAX_SAFE_INTEGER))throw new Error('This amount is too large.');return Number(minor);
}
export function formatMinor(value:number|string,currency:string):string{
 const digits=currencyDigits(currency);const minor=BigInt(value);const scale=BigInt(10)**BigInt(digits);const whole=minor/scale;const fractional=(minor%scale).toString().padStart(digits,'0');return `${currency} ${whole.toLocaleString('en-AU')}${digits?'.'+fractional:''}`;
}
export function minorDecimal(value:number,currency:string):string{const digits=currencyDigits(currency);const v=String(value).padStart(digits+1,'0');return digits?v.slice(0,-digits)+'.'+v.slice(-digits):v;}
export function invoiceState(r:BillingRecord,today:string){if(r.paid_minor===r.amount_minor)return 'paid' as const;return r.due_on<today?'overdue' as const:'due' as const;}
export function totalsByCurrency(rows:BillingRecord[]):Record<string,string>{const totals=rows.reduce<Record<string,bigint>>((result,r)=>{result[r.currency]=(result[r.currency]??BigInt(0))+BigInt(r.amount_minor)-BigInt(r.paid_minor);return result;},{});return Object.fromEntries(Object.entries(totals).map(([currency,minor])=>[currency,minor.toString()]));}
