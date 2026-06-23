import React from 'react'
import { Link } from 'react-router-dom'
import { AlertCircle, ArrowLeft } from 'lucide-react'

export const NotFound: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-6 animate-fade-in">
      <div className="p-4 bg-rose-500/10 border border-rose-500/25 rounded-2xl mb-4 text-rose-500 animate-bounce">
        <AlertCircle className="h-10 w-10" />
      </div>
      <h2 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
        Workspace Page Not Found
      </h2>
      <p className="text-sm text-muted-foreground max-w-xs mb-6 leading-relaxed">
        The page you are looking for does not exist or has been relocated to another workspace route.
      </p>
      <Link
        to="/"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground font-semibold shadow-md shadow-primary/20 hover:bg-primary/95 transition-all duration-300 glow-hover"
      >
        <ArrowLeft className="h-4 w-4" />
        Return to Dashboard
      </Link>
    </div>
  )
}

export default NotFound;
