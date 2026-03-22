import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      <div style={{ marginBottom: '32px', textAlign: 'center' }}>
        <div style={{ fontSize: '26px', fontWeight: '800', letterSpacing: '-0.5px', color: '#EEEEF8', marginBottom: '8px' }}>
          Neuro<span style={{ color: '#AAFF45' }}>Stack</span>
        </div>
        <div style={{ fontSize: '14px', color: 'rgba(238,238,248,0.5)' }}>
          Sign in to start studying smarter
        </div>
      </div>
      <SignIn
        path="/sign-in"
        routing="path"
        signUpUrl="/sign-up"
        afterSignInUrl="/"
        appearance={{
          variables: {
            colorPrimary: '#AAFF45',
            colorBackground: '#12121E',
            colorInputBackground: '#1A1A2A',
            colorInputText: '#EEEEF8',
            colorText: '#EEEEF8',
            colorTextSecondary: 'rgba(238,238,248,0.6)',
            borderRadius: '12px',
          },
          elements: {
            card: { boxShadow: 'none', border: '1px solid rgba(255,255,255,0.07)' },
            headerTitle: { color: '#EEEEF8' },
            headerSubtitle: { color: 'rgba(238,238,248,0.5)' },
            formButtonPrimary: {
              background: '#AAFF45',
              color: '#0B0B14',
              fontWeight: '700',
              '&:hover': { background: '#99EE34' },
            },
            footerActionLink: { color: '#AAFF45' },
            identityPreviewEditButton: { color: '#AAFF45' },
          },
        }}
      />
    </div>
  );
}
