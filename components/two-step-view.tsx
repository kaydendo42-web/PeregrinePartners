import { CopyKey } from "@/components/forms/copy-key";
import { VerifyForm } from "@/components/forms/verify-form";
import { signInVerify as copy } from "@/lib/content";
import { signOutForProject } from "@/app/sign-in/actions";

export type TwoStepSetup = { qr: string; secret: string };

/**
 * What /sign-in/verify draws. Setup (first sign-in) lays the three steps beside
 * the QR card; every sign-in after is just the code. Kept apart from the page
 * so the page stays about sessions and factors, and this stays about looks.
 */
export function TwoStepView({
  factorId,
  next,
  setup,
  project = "booking",
}: {
  factorId: string;
  next: string;
  setup: TwoStepSetup | null;
  project?: "booking" | "internal";
}) {
  const footer = (
    <div className="mt-[40px] flex flex-col items-start gap-[12px] border-t border-[color:var(--paper-10)] pt-[24px]">
      <p className="t-label text-white/60">{copy.lost}</p>
      <form action={signOutForProject}>
        <input type="hidden" name="project" value={project} />
        <input type="hidden" name="next" value={next} />
        <button
          type="submit"
          className="t-label text-white/60 underline underline-offset-[4px] transition-colors duration-300 hover:text-white"
        >
          {copy.signOut}
        </button>
      </form>
    </div>
  );

  if (!setup) {
    return (
      <>
        <h1 className="t-display mt-[40px] text-white">{copy.heading}</h1>
        <p className="t-body mt-[22px] text-white/80">{copy.sub}</p>
        <div className="mt-[36px]">
          <VerifyForm factorId={factorId} next={next} project={project} />
        </div>
        {footer}
      </>
    );
  }

  const [get, add, enter] = copy.steps;
  const { setupHeading, setupSub } =
    project === "internal" ? copy.founder : copy;
  return (
    <>
      <h1
        className="t-display mt-[40px] max-w-[640px] text-white"
        style={{ textWrap: "balance" }}
      >
        {setupHeading}
      </h1>
      <p className="t-body mt-[22px] max-w-[600px] text-white/80">
        {setupSub}
      </p>

      <div className="mt-[48px] grid items-start gap-[48px] md:grid-cols-[minmax(0,1fr)_auto] md:gap-[64px]">
        <ol className="twostep-steps">
          <li>
            <div>
              <p className="t-body text-white" style={{ fontWeight: 400 }}>
                {get.title}
              </p>
              <p className="t-label mt-[6px] text-white/60">{get.body}</p>
            </div>
          </li>
          <li>
            <div>
              <p className="t-body text-white" style={{ fontWeight: 400 }}>
                {add.title}
              </p>
              <p className="t-label mt-[6px] text-white/60">{add.body}</p>
            </div>
          </li>
          <li>
            <div className="min-w-0">
              <p className="t-body text-white" style={{ fontWeight: 400 }}>
                {enter.title}
              </p>
              <div className="mt-[16px]">
                <VerifyForm factorId={factorId} next={next} project={project} />
              </div>
            </div>
          </li>
        </ol>

        <figure className="twostep-qr m-0 md:order-none -order-1">
          {/* eslint-disable-next-line @next/next/no-img-element -- a data: URI, nothing to optimise */}
          <img src={setup.qr} alt={copy.qrAlt} width={200} height={200} />
          <figcaption>
            <CopyKey secret={setup.secret} />
          </figcaption>
        </figure>
      </div>

      {footer}
    </>
  );
}
