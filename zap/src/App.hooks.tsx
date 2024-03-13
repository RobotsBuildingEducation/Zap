import { useEffect, useState } from "react";
import { LightningAddress } from "@getalby/lightning-tools";
import { requestProvider } from "@getalby/bitcoin-connect-react";

export const useZap = (
  depositAmount = 1,
  depositMessage = "Robots Building Education Lecture"
) => {
  const [invoice, setInvoice] = useState(undefined);

  let payInvoice = async () => {
    const provider = await requestProvider();
    await provider.sendPayment(invoice);
  };

  let defineInvoice = async () => {
    try {
      const ln = new LightningAddress("levitatingnight182471@getalby.com");

      await ln.fetch();

      let invoiceResult = (
        await ln.requestInvoice({
          satoshi: 1,
          comment: "invoice requested",
        })
      ).paymentRequest;

      setInvoice(invoiceResult);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (invoice) {
      payInvoice();
    }
  }, [invoice]);

  return defineInvoice;
};
