import { init, Button } from "@getalby/bitcoin-connect-react";

import "./App.css";
import { useZap } from "./App.hooks";
import { useState } from "react";

init({
  appName: "Robots Building Education",
});

function App() {
  const zap = useZap();
  const [provider, setProvider] = useState(null);

  const handleConnect = (provider) => {
    setProvider(provider);
    localStorage.setItem("logged_in", "true");
  };
  const handleDisconnect = (provider) => {
    setProvider(null);
    localStorage.setItem("logged_in", "false");
  };

  const handleZap = () => {
    if (provider) {
      zap();
    } else {
      alert("Please connect your wallet first.");
    }
  };

  console.log("provider", provider);

  return (
    <>
      {localStorage.getItem("logged_in") === "true" ? (
        <>
          <h2>your wallet key</h2>
          <div>{provider?.client?.options?.walletPubkey}</div>
          <br />
          <br />
        </>
      ) : null}

      <Button onDisconnected={handleDisconnect} onConnected={handleConnect}>
        Connect Wallet
      </Button>

      <br />

      {localStorage.getItem("logged_in") === "true" ? (
        <button onClick={handleZap}>Zap bitcoin</button>
      ) : null}
    </>
  );
}

export default App;
