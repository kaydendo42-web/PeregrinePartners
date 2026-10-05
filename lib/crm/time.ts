function parts(instant:string|number,timezone:string){return Object.fromEntries(new Intl.DateTimeFormat('en-CA',{timeZone:timezone,year:'numeric',month:'2-digit',day:'2-digit',hour:'2-digit',minute:'2-digit',second:'2-digit',hourCycle:'h23'}).formatToParts(new Date(instant)).filter(p=>p.type!=='literal').map(p=>[p.type,p.value]));}
export function localDate(instant:string|number,timezone:string):string{const p=parts(instant,timezone);return `${p.year}-${p.month}-${p.day}`;}
export function localInput(instant:string|number,timezone:string):string{const p=parts(instant,timezone);return `${p.year}-${p.month}-${p.day}T${p.hour}:${p.minute}`;}
export function workspaceTimeCandidates(local:string,timezone:string):string[]{
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(local))throw new Error('Enter a valid local date and time.');
 const [y,m,d,h,min]=local.split(/[-T:]/).map(Number);if(y<1000||m<1||m>12||d<1||d>31||h>23||min>59)throw new Error('Enter a valid local date and time.');
 const nominal=Date.UTC(y,m-1,d,h,min);if(new Date(nominal).toISOString().slice(0,16)!==local)throw new Error('Enter a valid calendar date.');
 const offsets=new Set<number>();for(let hour=-48;hour<=48;hour+=6){const time=nominal+hour*3600000;const p=parts(time,timezone);offsets.add(Date.UTC(Number(p.year),Number(p.month)-1,Number(p.day),Number(p.hour),Number(p.minute),Number(p.second))-time);}
 return [...new Set([...offsets].map(offset=>new Date(nominal-offset).toISOString()).filter(instant=>localInput(instant,timezone)===local))].sort();
}
export const localTimeCandidates=workspaceTimeCandidates;
export function dayBounds(instant:string,timezone:string):{start:string;end:string}{
 const today=localDate(instant,timezone);const next=new Date(Date.parse(today+'T00:00:00Z')+86400000).toISOString().slice(0,10);
 const start=workspaceTimeCandidates(today+'T00:00',timezone)[0];const end=workspaceTimeCandidates(next+'T00:00',timezone)[0];if(!start||!end)throw new Error('Could not determine this workspace day.');return {start,end};
}
export function displayTime(instant:string,timezone:string){return new Intl.DateTimeFormat('en-AU',{timeZone:timezone,dateStyle:'medium',timeStyle:'short'}).format(new Date(instant));}
