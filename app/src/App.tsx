import { sdk } from "@farcaster/frame-sdk";
import { useEffect } from "react";
import { useAccount, useConnect, useSignMessage } from "wagmi";

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="max-w-2xl mx-auto space-y-8">
        <h1 className="text-3xl font-bold">Mini App + Vite + TS + React + Wagmi</h1>
        <ConnectMenu />
      </div>
    </div>
  );
}

function ConnectMenu() {
  const { isConnected, address } = useAccount();
  const { connect, connectors } = useConnect();

  const handleConnect = () => {
    connect({ connector: connectors[0] });
  };

  if (isConnected) {
    return (
      <div className="space-y-4">
        <div className="text-lg">Connected account:</div>
        <div className="font-mono bg-gray-800 p-3 rounded-lg">{address}</div>
        <SignButton />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors"
    >
      Connect
    </button>
  );
}

function SignButton() {
  const { signMessage, isPending, data, error } = useSignMessage();

  return (
    <div className="space-y-4">
      <button
        type="button"
        onClick={() => signMessage({ message: "hello world" })}
        disabled={isPending}
        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isPending ? "Signing..." : "Sign message"}
      </button>
      {data && (
        <div className="space-y-2">
          <div className="text-lg">Signature</div>
          <div className="font-mono bg-gray-800 p-3 rounded-lg break-all">{data}</div>
        </div>
      )}
      {error && (
        <div className="space-y-2">
          <div className="text-lg text-red-500">Error</div>
          <div className="text-red-400">{error.message}</div>
        </div>
      )}
    </div>
  );
}

export default App;
