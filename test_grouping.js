const group = { client: "Sainsbury's" };
const proj = { parentAccount: "Sainsbury's", sfAccount: "Argos UK" };

let acct = proj.parentAccount;
if (!acct || acct.trim().toLowerCase() === group.client.trim().toLowerCase()) {
    acct = proj.sfAccount || acct || "(No Account)";
}
if (!acct) acct = "(No Account)";

console.log("Account:", acct);
