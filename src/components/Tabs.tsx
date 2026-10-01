import { ReactNode, useState } from 'react'

interface TabsProps {
  children: ReactNode
  defaultValue?: string
}

interface TabsListProps {
  children: ReactNode
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
}

interface TabsContentProps {
  value: string
  children: ReactNode
}

export function Tabs({ children, defaultValue = '' }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultValue)

  return (
    <div>
      {/* Render all children - triggers and content */}
      {/* This is a simple tab component */}
      {children}
    </div>
  )
}

export function TabsList({ children }: TabsListProps) {
  return <div className="flex gap-4 border-b border-soft-grey mb-6">{children}</div>
}

export function TabsTrigger({ value, children }: TabsTriggerProps) {
  return (
    <button className="px-4 py-2 text-sm font-semibold uppercase tracking-wider hover:opacity-75">
      {children}
    </button>
  )
}

export function TabsContent({ value, children }: TabsContentProps) {
  return <div>{children}</div>
}
