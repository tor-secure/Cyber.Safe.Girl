export default function VerifyCertificateLayout({
    children,
  }: {
    children: React.ReactNode
  }) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto py-4">
          <h1 className="text-3xl font-bold text-center mb-8">Cyber Safe Girl Certificate Verification</h1>
          {children}
        </div>
      </div>
    )
  }