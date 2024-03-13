import { useEffect, useState } from "react";
import { LightningAddress } from "@getalby/lightning-tools";
import { requestProvider } from "@getalby/bitcoin-connect-react";

export const useZap = () => {
  const [invoice, setInvoice] = useState(undefined);

  let payInvoice = async () => {
    // get the sending user and send a transaction to invoice address
    const provider = await requestProvider();
    await provider.sendPayment(invoice);
  };

  let defineInvoice = async () => {
    // define a receiving address
    const address = new LightningAddress("levitatingnight182471@getalby.com");

    await address.fetch();

    let invoiceData = await address.requestInvoice({
      satoshi: 1,
      comment: "invoice requested",
    });

    let result = invoiceData?.paymentRequest;

    setInvoice(result);
  };

  useEffect(() => {
    if (invoice) {
      payInvoice();
    }
  }, [invoice]);

  return defineInvoice;
};
