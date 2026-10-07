import React from "react";
import { createRoot } from "react-dom/client";
import { AppRouterContext } from "next/dist/shared/lib/app-router-context.shared-runtime";
import { ActivityForm } from "../../../components/crm/activity-form";
import { ContactForm } from "../../../components/crm/contact-form";
import { FollowUpForm } from "../../../components/crm/follow-up-form";
import { FollowUpList } from "../../../components/crm/follow-up-list";
import { WorkspaceLiveRefresh } from "../../../components/crm/live-refresh";

const audit = {
  id: "00000000-0000-4000-8000-000000000201",
  workspace_id: "00000000-0000-4000-8000-000000000001",
  version: 1,
  created_at: "2026-10-06T00:00:00Z",
  updated_at: "2026-10-06T00:00:00Z",
  created_by: null,
  updated_by: null,
};
const business = "00000000-0000-4000-8000-000000000101";
const owner = "00000000-0000-4000-8000-000000000011";
const contact = {
  ...audit,
  business_id: business,
  name: "Original contact",
  email: null,
  phone: null,
  is_primary: false,
  source_fields: { "Rating [3]": "4.8" },
};
const followUp = {
  ...audit,
  id: "00000000-0000-4000-8000-000000000202",
  business_id: business,
  assigned_to: owner,
  due_at: "2026-10-07T00:00:00Z",
  instruction: "Call tomorrow",
  state: "open",
  business: { id: business, name: "Example business", do_not_contact: false },
};
const router = {
  refresh() {},
  replace() {},
  push() {},
  prefetch() {},
  back() {},
  forward() {},
};
const root = createRoot(document.getElementById("root"));
const queueRoot = createRoot(document.getElementById("queue"));
window.crmRenderQueue = (show) =>
  queueRoot.render(
    <AppRouterContext.Provider value={router}>
      <FollowUpList
        rows={show ? [followUp] : []}
        members={[{ user_id: owner, display_name: "Owner", active: true }]}
        timezone="Australia/Melbourne"
      />
    </AppRouterContext.Provider>,
  );
window.crmRenderForms = () =>
  root.render(
    <AppRouterContext.Provider value={router}>
      <section id="activity">
        <ActivityForm
          business={business}
          doNotContact={false}
          timezone="Australia/Melbourne"
        />
      </section>
      <section id="contact">
        <ContactForm business={business} contact={contact} />
      </section>
      <section id="follow-up">
        <FollowUpForm
          followUp={followUp}
          members={[{ user_id: owner, display_name: "Owner", active: true }]}
          timezone="Australia/Melbourne"
          blocked={false}
        />
      </section>
    </AppRouterContext.Provider>,
  );
window.crmRenderForms();
window.crmRenderQueue(true);
const liveRoot = createRoot(document.getElementById("lifecycle"));
window.crmRenderLive = (show, key) => {
  window.crmAuthStarted = false;
  liveRoot.render(
    show ? (
      <AppRouterContext.Provider value={router}>
        <WorkspaceLiveRefresh
          key={key}
          workspaceId={audit.workspace_id}
          userId={owner}
          url="https://synthetic.invalid"
          anonKey="synthetic"
        >
          <p id="private-data">Private fixture</p>
        </WorkspaceLiveRefresh>
      </AppRouterContext.Provider>
    ) : null,
  );
};
