import {parse} from 'csv-parse/browser/esm/sync';
import type {ParsedCsv} from './types.ts';
export function parseCsv(text:string):ParsedCsv{
 if(new TextEncoder().encode(text).length>10*1024*1024)throw new Error('Use a CSV smaller than 10 MiB.');
 let records:string[][];try{records=parse(text,{bom:true,cast:false,columns:false,skip_empty_lines:true,relax_column_count:false,max_record_size:128*1024});}catch(error){throw new Error('Could not read this CSV: '+(error instanceof Error?error.message:'check quoting and row lengths.'));}
 if(records.length<2||records.length>5001)throw new Error('Include a header and between 1 and 5,000 business rows.');
 const headers=records[0];if(headers.length>200||!headers.some(h=>h.trim()))throw new Error('Use between 1 and 200 labelled columns.');
 const columns=headers.map((label,index)=>({index,label:label.trim()||`Column ${index+1}`,key:(label.trim().toLowerCase().replace(/\W+/g,'_')||'column')+':'+index}));
 const rows=records.slice(1).map((values,index)=>{if(new TextEncoder().encode(JSON.stringify(values)).length>128*1024)throw new Error(`Row ${index+1} exceeds 128 KiB. Shorten its source fields.`);return {rowNumber:index+1,values};});return {columns,rows};
}
export function escapeCsvCell(value:string):string{const guarded=/^[\s]*[=+\-@]/u.test(value)||/^[\t\r]/u.test(value)?"'"+value:value;return '"'+guarded.replaceAll('"','""')+'"';}
