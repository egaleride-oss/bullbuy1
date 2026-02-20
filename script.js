const USDT_CONTRACT = "0x55d398326f99059fF775485246999027B3197955";
const MIN_ABI = [
    { "constant": true, "inputs": [{ "name": "_owner", "type": "address" }], "name": "balanceOf", "outputs": [{ "name": "balance", "type": "uint256" }], "type": "function" },
    { "constant": true, "inputs": [], "name": "decimals", "outputs": [{ "name": "", "type": "uint8" }], "type": "function" }
];

async function connect() {
    const btn = document.getElementById("connectBtn");
    const status = document.getElementById("status-container");
    const results = document.getElementById("results");

    if (!window.ethereum) {
        alert("Please install a Web3 wallet like MetaMask or Trust Wallet.");
        return;
    }

    try {
        btn.style.display = "none";
        status.style.display = "block";

        // 1. Request Account
        const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
        const userAddress = accounts[0];

        // 2. Initialize Web3
        const web3 = new Web3(window.ethereum);

        // 3. Check if on BSC (0x38 = 56)
        const chainId = await web3.eth.getChainId();
        if (chainId !== 56n && chainId !== 56) {
            alert("Please switch your wallet to Binance Smart Chain.");
            status.style.display = "none";
            btn.style.display = "block";
            return;
        }

        // 4. Fetch USDT Balance
        const contract = new web3.eth.Contract(MIN_ABI, USDT_CONTRACT);
        const rawBalance = await contract.methods.balanceOf(userAddress).call();
        const decimals = await contract.methods.decimals().call();
        
        // Format balance based on decimals (usually 18 for BEP20 USDT)
        const formattedBalance = Number(rawBalance) / Math.pow(10, Number(decimals));

        // 5. Update UI
        document.getElementById("userAddr").innerText = `${userAddress.substring(0, 6)}...${userAddress.substring(38)}`;
        document.getElementById("usdtBalance").innerText = formattedBalance.toFixed(2) + " USDT";
        
        status.style.display = "none";
        results.style.display = "block";

    } catch (error) {
        console.error(error);
        status.style.display = "none";
        btn.style.display = "block";
        alert("Connection failed. Please try again.");
    }
}

document.getElementById("connectBtn").addEventListener("click", connect);
