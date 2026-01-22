export default function OfflinePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-dark-900 p-4">
      <div className="text-center">
        <div className="text-6xl mb-4">📡</div>
        <h1 className="text-2xl font-bold text-white mb-2">You're Offline</h1>
        <p className="text-gray-400 mb-6">
          Please check your internet connection and try again.
        </p>
        <button
          onClick={() => window.location.reload()}
          className="btn btn-primary"
        >
          Try Again
        </button>
      </div>
    </div>
  );
}
