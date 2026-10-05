import test from 'node:test';
import assert from 'node:assert/strict';
import { safeDestination, defaultDestination } from '../../lib/auth/next.ts';
import { credentialDestination } from '../../lib/auth/next.ts';

test('redirects remain within owner or console paths', () => {
  for (const bad of ['//outside.example','https://outside.example','/ownerish','/consoleevil','/owner/../sign-in','/owner/%5cevil','/owner/%zz','/console/\nvenue','/owner/%00','/owner/%2f%2foutside']) {
    assert.equal(safeDestination(bad), null, bad);
  }
  assert.equal(safeDestination('/owner/outreach?page=2'), '/owner/outreach?page=2');
  assert.equal(defaultDestination(null,true),'/owner');
  assert.equal(defaultDestination(null,false),'/console');
  assert.equal(defaultDestination('/console/the-peacock/calendar',true),'/console/the-peacock/calendar');
  assert.equal(defaultDestination('/owner/outreach',false),'/owner/outreach');
});
test('private workspace requires an authenticated two-step session',()=>{
 assert.equal(credentialDestination(false,'aal2'),'/sign-in?next=%2Fowner');
 assert.equal(credentialDestination(true,'aal1'),'/sign-in/verify?next=%2Fowner');
 assert.equal(credentialDestination(true,null),'/sign-in/verify?next=%2Fowner');
 assert.equal(credentialDestination(true,'aal2'),null);
});
