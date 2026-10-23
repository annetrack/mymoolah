/* Public display configuration only. Never put API keys or private credentials here. */
window.CHECKOUT_CONFIG = {
  currency: "PHP",
  paypalMeUrl: "https://www.paypal.com/paypalme/REPLACE_ME",
  paymentMethods: {
    gcash: { label: "GCash", accountName: "Add account name", accountNumber: "Add GCash number", qrImage: "/assets/images/gcash-qr-placeholder.svg" },
    gotyme: { label: "GoTyme", accountName: "Add account name", accountNumber: "Add account details", qrImage: "/assets/images/gotyme-qr-placeholder.svg" },
    bpi: { label: "BPI", accountName: "Add account name", accountNumber: "Add account details", qrImage: "/assets/images/bpi-qr-placeholder.svg" }
  }
};
