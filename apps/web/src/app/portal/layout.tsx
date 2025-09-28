import { Metadata } from 'next'
import { PortalLayout } from '@/components/portal/layout/portal-layout'

export const metadata: Metadata = {
  title: 'Client Portal - CPA Platform',
  description: 'Secure client portal for managing documents, finances, and communications with your CPA',
}

export default function PortalLayoutPage({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <PortalLayout>
      {children}
    </PortalLayout>
  )
}