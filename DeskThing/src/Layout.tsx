import './index.css';

export default function RootLayout({
  children,
}) {
  return (
    <div className={`font-geist`}>
      {children}
    </div>
  )
}