import 'server-only';
import {revalidatePath} from 'next/cache';
import {requireOwner} from '@/lib/owner/access';
import {parseUuid} from './validation';
import type {MutationResult} from './types';
export async function rpcMutation<T>(name:string,requestId:string|null,args:()=>Record<string,unknown>,invalidate=true):Promise<MutationResult<T>>{
 const {client,context}=await requireOwner();
 let input:Record<string,unknown>;try{input={...args(),p_workspace:context.workspaceId,...(requestId?{p_request_id:parseUuid(requestId)}:{})};}catch(error){return {ok:false,kind:'validation',message:error instanceof Error?error.message:'Check the submitted fields.'};}
 const {data,error}=await client.rpc(name,input);
 if(error){if(error.code==='42501')return {ok:false,kind:'forbidden',message:'Your workspace access changed. Sign in again.'};if(['23514','23502','23503','23505','22P02','P0002','22007','22008'].includes(error.code))return {ok:false,kind:'validation',message:'That change could not be saved. Check the fields, active owner and record selection.'};return {ok:false,kind:'unavailable',message:'That change did not save. Check your connection and try again.'};}
 if(data?.ok&&invalidate)revalidatePath('/owner','layout');
 return data as MutationResult<T>;
}
