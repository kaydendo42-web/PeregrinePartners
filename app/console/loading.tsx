import { signInVerify } from "@/lib/content";
import "./console.css";

/**
 * After the code is accepted, while the console finds the member's venue. The
 * sidebar colour arrives first so the hand-off from the dark sign-in card is
 * one continuous dark, not a white flash.
 */
export default function Loading() {
  return (
    <main className="console-shell console-shell--opening" aria-busy="true">
      <p className="console-opening" role="status">
        <span className="console-spin" aria-hidden />
        {signInVerify.opening}
      </p>
    </main>
  );
}
