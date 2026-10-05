import 'server-only';
import {notFound} from 'next/navigation';
import {requireOwner} from '@/lib/owner/access';
import {escapeLike,parseUuid,parseVersion} from './validation';
import type {OwnerContext,BusinessQuery,Business,PageResult,Contact,Activity,FollowUp,Member} from './types';
export async function ownerClient(context:OwnerContext){const auth=await requireOwner();if(auth.context.workspaceId!==context.workspaceId)throw new Error('Workspace access changed.');return auth.client;}
export async function listMembers(context:OwnerContext):Promise<Member[]>{const client=await ownerClient(context);const {data,error}=await client.from('crm_workspace_members').select('user_id,display_name,active').eq('workspace_id',context.workspaceId).eq('active',true).order('display_name');if(error)throw new Error('Could not load owners.');return data??[];}
export async function listBusinesses(context:OwnerContext,query:BusinessQuery):Promise<PageResult<Business>>{
 const client=await ownerClient(context);let request=client.from('crm_business_summary').select('*',{count:'exact'}).eq('workspace_id',context.workspaceId).eq('origin','outreach').eq('archived',false);
 if(query.q)request=request.ilike('name','%'+escapeLike(query.q)+'%');
 if(query.stage)request=request.eq('stage',query.stage);
 if(query.owner)request=query.owner==='unassigned'?request.is('assigned_to',null):request.eq('assigned_to',query.owner);
 if(query.location)request=request.ilike('location','%'+escapeLike(query.location)+'%');
 if(query.industry)request=request.ilike('industry','%'+escapeLike(query.industry)+'%');
 if(query.tag)request=request.contains('tags',[query.tag]);if(query.priority)request=request.eq('priority',query.priority);if(query.batch)request=request.eq('import_batch_id',query.batch);
 if(query.incomplete)request=request.eq('incomplete_contact',true);
 if(query.due)request=request.lte('next_follow_up',new Date().toISOString()).eq('do_not_contact',false);
 const page=parseVersion(query.page);const {data,error,count}=await request.order(query.sort,{ascending:query.sort==='name'||query.sort==='next_follow_up',nullsFirst:false}).order('id').range((page-1)*50,page*50-1);
 if(error)throw new Error('Could not load outreach.');
 const rows=(data??[]) as Business[];
 if(rows.length){const {data:contacts,error:contactError}=await client.from('crm_contacts').select('*').eq('workspace_id',context.workspaceId).in('business_id',rows.map(r=>r.id)).eq('is_primary',true);if(contactError)throw new Error('Could not load contacts.');for(const row of rows)row.contacts=(contacts??[]).filter(c=>c.business_id===row.id) as Contact[];}
 return {rows,total:count??0,page,pageSize:50};
}
export async function getBusiness(context:OwnerContext,id:string){
 const client=await ownerClient(context);const businessId=parseUuid(id);
 const results=await Promise.all([
  client.from('crm_business_summary').select('*').eq('workspace_id',context.workspaceId).eq('id',businessId).maybeSingle(),
  client.from('crm_contacts').select('*').eq('workspace_id',context.workspaceId).eq('business_id',businessId).order('is_primary',{ascending:false}).order('created_at').limit(100),
  client.from('crm_activities').select('*').eq('workspace_id',context.workspaceId).eq('business_id',businessId).order('occurred_at',{ascending:false}).order('id').limit(100),
  client.from('crm_follow_ups').select('*').eq('workspace_id',context.workspaceId).eq('business_id',businessId).order('due_at').limit(100)
 ]);
 if(results.some(r=>r.error))throw new Error('Could not load this business.');if(!results[0].data)notFound();
 const members=await listMembers(context);
 return {business:results[0].data as Business,contacts:results[1].data as Contact[],activities:(results[2].data as Activity[]).map(a=>({...a,actor_name:members.find(m=>m.user_id===a.actor_id)?.display_name??'Owner'})),followUps:results[3].data as FollowUp[]};
}
export type FollowUpFilter={owner:string|null;state:'open'|'done'|'cancelled';period:'overdue'|'today'|'upcoming'|'all';page:number;now:string;todayStart:string;tomorrowStart:string};
export async function listFollowUps(context:OwnerContext,filter:FollowUpFilter):Promise<PageResult<FollowUp>>{
 const client=await ownerClient(context);let request=client.from('crm_follow_ups').select('*,business:crm_businesses!inner(id,name,do_not_contact,archived)',{count:'exact'}).eq('workspace_id',context.workspaceId).eq('state',filter.state).eq('business.archived',false);
 if(filter.state==='open')request=request.eq('business.do_not_contact',false);
 if(filter.owner)request=request.eq('assigned_to',parseUuid(filter.owner));
 if(filter.period==='overdue')request=request.lt('due_at',filter.now);else if(filter.period==='today')request=request.gte('due_at',filter.todayStart).lt('due_at',filter.tomorrowStart);else if(filter.period==='upcoming')request=request.gte('due_at',filter.tomorrowStart);
 const {data,error,count}=await request.order('due_at').order('id').range((filter.page-1)*50,filter.page*50-1);if(error)throw new Error('Could not load follow-ups.');return {rows:(data??[]) as unknown as FollowUp[],total:count??0,page:filter.page,pageSize:50};
}
