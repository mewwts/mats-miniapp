import { sdk } from '@farcaster/frame-sdk';
import { useEffect } from 'react';
import { useAccount, useConnect, useSignMessage } from 'wagmi';

function App() {
  useEffect(() => {
    sdk.actions.ready();
  }, []);

  return (
    <div className="min-h-screen bg-gray-900 p-8 text-white">
      <div className="mx-auto max-w-2xl space-y-8">
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
        <div className="rounded-lg bg-gray-800 p-3 font-mono">{address}</div>
        <SignButton />
      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={handleConnect}
      className="rounded-lg bg-blue-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-blue-700"
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
        onClick={() => signMessage({ message: 'hello world' })}
        disabled={isPending}
        className="rounded-lg bg-green-600 px-4 py-2 font-semibold text-white transition-colors hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isPending ? 'Signing...' : 'Sign message'}
      </button>
      {data && (
        <div className="space-y-2">
          <div className="text-lg">Signature</div>
          <div className="rounded-lg bg-gray-800 p-3 font-mono break-all">{data}</div>
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
