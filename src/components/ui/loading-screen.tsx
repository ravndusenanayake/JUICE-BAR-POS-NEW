import { Loader2, Store } from "lucide-react"

export function LoadingScreen({ message = "Loading your experience..." }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] h-full w-full bg-slate-50/50 backdrop-blur-sm z-50">
      <div className="relative flex items-center justify-center">
        <div className="absolute -inset-2 bg-emerald-100 rounded-full animate-ping opacity-75"></div>
        <div className="relative bg-emerald-500 rounded-full p-4 shadow-lg shadow-emerald-200">
          <Store className="w-8 h-8 text-white animate-pulse" />
        </div>
      </div>
      <div className="mt-8 flex flex-col items-center gap-2">
        <h3 className="text-lg font-semibold text-slate-800 tracking-tight">Juice Bar POS</h3>
        <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
          <Loader2 className="w-4 h-4 animate-spin text-emerald-500" />
          {message}
        </div>
      </div>
    </div>
  )
}

export function FullPageLoading({ message = "Loading your experience..." }: { message?: string }) {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-slate-50 z-50">
      <LoadingScreen message={message} />
    </div>
  )
}
