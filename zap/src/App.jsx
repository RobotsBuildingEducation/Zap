// src/App.js
import React, { useState, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";

import NDK, {
  NDKPrivateKeySigner,
  NDKUser,
  NDKZapper,
} from "@nostr-dev-kit/ndk";
import { NDKCashuWallet } from "@nostr-dev-kit/ndk-wallet";

export default function App() {
  const [keys, setKeys] = useState({
    privateKey: null,
    publicKey: null,
    nsec: null,
    npub: null,
  });

  //identity & wallet connections
  const [ndk, setNdk] = useState(null);
  const [wallet, setWallet] = useState(null);
  const [invoice, setInvoice] = useState("");
  const [balance, setBalance] = useState(0);

  //loading states
  const [isCreatingWallet, setIsCreatingWallet] = useState(false);
  const [isDepositing, setIsDepositing] = useState(false);
  const [isSendingMoney, setIsSendingMoney] = useState(false);

  //setup listeners for wallet balance changes
  useEffect(() => {
    if (!wallet) return;

    wallet.start({ since: Date.now() });

    const onBalanceChange = (walletBalance) => {
      let amount = 0;

      // 1) If the event payload has a numeric amount, use that
      if (walletBalance) {
        amount = walletBalance.amount;
      } else if (wallet.balance) {
        amount = wallet.balance.amount;
      }

      setBalance(amount);
      setIsSendingMoney(false);
    };

    wallet.on("balance_updated", onBalanceChange);
  }, [wallet]);

  //creates an account with a single button press.
  const createAccount = () => {
    localStorage.removeItem("nostr-keys");
    const keySigner = NDKPrivateKeySigner.generate();

    const newKeys = {
      privateKey: keySigner.privateKey,
      publicKey: keySigner.pubkey,
      nsec: keySigner.nsec,
      npub: keySigner.userSync.npub,
    };

    setKeys(newKeys);
  };

  //sets up connection to the transaction network and creates a wallet
  const handleCreateWallet = async () => {
    setIsCreatingWallet(true);

    const ndkInstance = new NDK({
      explicitRelayUrls: ["wss://relay.damus.io", "wss://relay.primal.net"],
      devWriteRelayUrls: ["wss://relay.damus.io", "wss://relay.primal.net"],
      signer: new NDKPrivateKeySigner(keys.privateKey),
    });

    await ndkInstance.connect();
    setNdk(ndkInstance);

    const walletInstance = new NDKCashuWallet(ndkInstance);
    walletInstance.mints = ["https://mint.minibits.cash/Bitcoin"];
    walletInstance.walletId = "Robots Building Education Wallet";

    await walletInstance.getP2pk();

    await walletInstance.publish();

    walletInstance.start({ since: Date.now() });

    setWallet(walletInstance);
    setIsCreatingWallet(false);
  };

  //sets up a deposit address or QR code to send money to the app
  const handleDeposit = async () => {
    setIsDepositing(true);
    const deposit = wallet.deposit(10, wallet.mints[0]);
    const address = await deposit.start();

    setInvoice(address);
    deposit.on("success", () => {
      setBalance(wallet.balance.amount);
    });

    setIsDepositing(false);
  };

  //sends money to the recipient (1 tenth of $0.01 USD in bitcoin, or a "sat" aka bitcoin cents)
  const handleZap = async () => {
    setIsSendingMoney(true);
    ndk.wallet = wallet;

    const user = await NDKUser.fromNip05("sheilfer@primal.net", ndk);
    const zapper = new NDKZapper(user, 1, "sat", {
      comment: "I'm sending you a cent of Bitcoin!",
    });

    zapper.on("complete", () =>
      console.log("sheilfer received a cent of Bitcoin!")
    );

    // fire the zap
    zapper.zap();
  };

  //lets users copy an address in case they're on a mobile device
  const handleCopyInvoice = () => {
    navigator.clipboard.writeText(invoice);
    window.alert("You copied the invoice");
  };

  return (
    <section style={{ padding: 20, fontFamily: "sans-serif" }}>
      <h3>Nostr Account Creation</h3>

      {keys.npub ? (
        <>
          <p>
            <strong>npub</strong>: {keys.npub}
          </p>
          <p>
            <strong>nsec (keep secret!)</strong>: {keys.nsec}
          </p>

          <p>
            <strong>balance</strong>: {balance} sats
          </p>

          {!wallet && (
            <button onClick={handleCreateWallet}>Create Wallet</button>
          )}
          <br />
          {isCreatingWallet ? "Creating wallet..." : null}

          {wallet && (
            <>
              {balance < 1 ? (
                <>
                  <button onClick={handleDeposit}>
                    Deposit 10 sats (~$0.01 USD)
                  </button>
                  <br />
                  {isDepositing ? "Generating address..." : null}
                  <br />
                  <br />
                  {invoice && (
                    <>
                      <QRCodeSVG
                        value={invoice}
                        size={256}
                        style={{ zIndex: 10 }}
                      />
                      <br />
                      <br />
                      or
                      <br />
                      <br />
                      <button onClick={() => handleCopyInvoice(invoice)}>
                        Copy invoice address
                      </button>
                      <br />
                      <a href="https://click.cash.app/ui6m/home2022">
                        Send bitcoin to the copied address on Cash App, or your
                        preferred lightning wallet
                      </a>
                    </>
                  )}
                </>
              ) : null}
              {balance > 0 ? (
                <>
                  <button onClick={handleZap}>
                    Zap sheilfer@primal.net 1 sat
                  </button>
                  <br />
                  {isSendingMoney ? "Sending money..." : null}
                  <br />
                  <section>
                    <a href="https://nutlife.lol/" target="_blank">
                      Verify your transaction{" "}
                    </a>{" "}
                  </section>
                </>
              ) : null}
            </>
          )}
        </>
      ) : (
        <button onClick={createAccount}>Create account</button>
      )}
    </section>
  );
}
