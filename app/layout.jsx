import './globals.css'

export const metadata = {
  title: 'Little Genius - Science Learning for Kids',
  description: 'Science Learning for Kids 5-9',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>{children}</body>
    </html>
  )
}
