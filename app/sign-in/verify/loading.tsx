import { AuthFrame } from "@/components/auth-frame";
import { AuthProgress } from "@/components/forms/auth-progress";
import { signInVerify } from "@/lib/content";

/** Between the password and the code: the server is checking the session and the factor. */
export default function Loading() {
  return (
    <AuthFrame label={signInVerify.eyebrow}>
      <h1 className="t-display mt-[40px] text-white">{signInVerify.heading}</h1>
      <div className="mt-[40px]">
        <AuthProgress text={signInVerify.preparing} />
      </div>
    </AuthFrame>
  );
}
