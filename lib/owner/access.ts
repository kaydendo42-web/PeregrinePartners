import 'server-only';
import { connection } from 'next/server';
import { notFound, redirect } from 'next/navigation';
import { supabase, supabaseEnv } from '@/lib/supabase/server';
import { credentialDestination } from '@/lib/auth/next';
import type { OwnerContext } from '@/lib/crm/types';

export async function ownerSignedIn():Promise<boolean> {
  await connection();
  if(!supabaseEnv())return false;
  const client=await supabase();
  const {data:{user},error}=await client.auth.getUser();
  if(error||!user)return false;
  const {data,error:membershipError}=await client.rpc('crm_owner_status');
  if(membershipError)throw new Error('Could not verify workspace access.');
  return data===true;
}

/** Each data read and action uses this guard; the layout alone is insufficient. */
export async function requireOwner() {
  await connection();
  if(!supabaseEnv())redirect('/sign-in?next=%2Fowner');
  const client=await supabase();
  const {data:{user},error:userError}=await client.auth.getUser();
  if(userError||!user)redirect('/sign-in?next=%2Fowner');
  const {data:assurance,error:assuranceError}=await client.auth.mfa.getAuthenticatorAssuranceLevel();
  if(assuranceError)throw new Error('Could not verify sign-in.');
  const destination=credentialDestination(true,assurance?.currentLevel??null);
  if(destination)redirect(destination);
  const {data:isOwner,error:ownerError}=await client.rpc('crm_owner_status');
  if(ownerError)throw new Error('The owner workspace needs setup. Please contact Peregrine.');
  if(isOwner!==true)notFound();
  const {data:workspace,error:workspaceError}=await client.from('crm_workspaces').select('id,timezone').eq('slug','peregrine').eq('kind','internal').maybeSingle();
  if(workspaceError)throw new Error('Could not load your workspace.');
  if(!workspace)notFound();
  const {data:member,error:memberError}=await client.from('crm_workspace_members').select('display_name').eq('workspace_id',workspace.id).eq('user_id',user.id).eq('active',true).maybeSingle();
  if(memberError)throw new Error('Could not verify workspace membership.');
  if(!member)notFound();
  const context:OwnerContext={userId:user.id,workspaceId:workspace.id,timezone:workspace.timezone,displayName:member.display_name};
  return {client,context};
}
