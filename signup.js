import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div style={{ minHeight: '100vh', background: '#0B0B14', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '26px', fontWeight: '800', color: '#EEEEF8', marginBottom: '8px' }}>
          Neuro<span style={{ color: '#AAFF45' }}>Stack</span>
        </div>
        <div style={{ fontSize: '14px', color: 'rgba(238,238,248,0.5)' }}>Create your free account</div>
      </div>
      <SignUp
        path="/sign-up"
        routing="path"
        signInUrl="/sign-in"
        afterSignUpUrl="/"
        appearance={{
          variables: {
            colorPrimary: '#AAFF45',
            colorBackground: '#12121E',
            colorInputBackground: '#1A1A2A',
            colorInputText: '#EEEEF8',
            colorText: '#EEEEF8',
            borderRadius: '12px',
          },
          elements: {
            card: { boxShadow: 'none', border: '1px solid rgba(255,255,255,0.07)' },
            formButtonPrimary: { background: '#AAFF45', color: '#0B0B14', fontWeight: '700' },
            footerActionLink: { color: '#AAFF45' },
          },
        }}
      />
    </div>
  );
}
