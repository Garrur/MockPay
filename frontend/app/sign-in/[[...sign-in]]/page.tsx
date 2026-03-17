import { SignIn } from "@clerk/nextjs";

export default function Page() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#0a0a0f]">
      <SignIn fallbackRedirectUrl="/dashboard" signUpUrl="/sign-up" appearance={{
        elements: {
          formButtonPrimary: "bg-primary hover:bg-primary/90 text-sm normal-case",
          card: "bg-[#111118] border border-white/10 shadow-xl",
          headerTitle: "text-white",
          headerSubtitle: "text-gray-400",
          socialButtonsBlockButton: "bg-white/5 border-white/10 text-white hover:bg-white/10",
          socialButtonsBlockButtonText: "text-white",
          dividerLine: "bg-white/10",
          dividerText: "text-gray-400",
          formFieldLabel: "text-gray-300",
          formFieldInput: "bg-white/5 border-white/10 text-white",
          footerActionText: "text-gray-400",
          footerActionLink: "text-primary hover:text-primary/90",
          identityPreviewText: "text-white",
          identityPreviewEditButtonIcon: "text-primary",
        }
      }} />
    </div>
  );
}
