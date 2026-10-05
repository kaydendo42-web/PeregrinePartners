// The browser harness delays only the server action response. Real form logic is bundled unchanged.
function delayed(kind, args) {
  return new Promise((resolve) => {
    window.crmTestRequests ??= {};
    window.crmTestRequests[kind] = { args, resolve };
  });
}
export const addActivity = (...args) => delayed("activity", args);
export const saveContact = (...args) => delayed("contact", args);
export const saveFollowUp = (...args) => delayed("followUp", args);
