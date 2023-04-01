import React, { useEffect, useState } from "react";
import { ethers } from "ethers";
import UsersABI from "./UsersABI.json"; // Import the ABI
import tokenABI from './tokenABI.json';
import "./App.css";

const usersContractAddress = "0x3537e4a0AFea92C528Df905246a517794Fad90Cb";
const tokenAddress = "0x4Bc6663B63E6fa62C049Ef832d41703593668eE7";
const provider = new ethers.providers.Web3Provider(window.ethereum);

function App() {
  const [tokens, setTokens] = useState([]);
  const [connected, setConnected] = useState(false)
  const [signer, setSigner] = useState(null)

  const [openRegister, setOpenRegister] = useState(false)

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [imageURI, setImageURI] = useState("");
  const [rewardAmount, setRewardAmount] = useState("");
  const [redeemAmount, setRedeemAmount ] = useState("");
  const [balance, setBalance] = useState("")


  const connect = async () => {
    const provider = new ethers.providers.Web3Provider(window.ethereum)
    await provider.send("eth_requestAccounts", []);
    const signer = provider.getSigner()
    setSigner(signer)
    const address = await signer.getAddress()
    console.log(address)
    const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
    const getBalance = await tokenContract.balanceOf(address)
    setBalance(getBalance.toString())
    console.log(getBalance.toString())
    setConnected(true)
  }

  const fetchTokens = async () => {
    const usersContract = new ethers.Contract(usersContractAddress, UsersABI, provider);
    const totalSupply = await usersContract.getTotalSupply();

    let fetchedTokens = [];
    for (let i = 1; i <= totalSupply; i++) {
      const owner = await usersContract.ownerOf(i);
      const tokenURI = await usersContract.tokenURI(i);
      const tokenData = JSON.parse(atob(tokenURI.split(",")[1]));
      const decodedSvg = atob(tokenData.image.split(",")[1]);

      fetchedTokens.push({
        tokenId: i,
        owner,
        name: tokenData.name,
        email: tokenData.email,
        walletAddress: tokenData.walletAddress,
        imageURI: tokenData.image,
        svg: decodedSvg,
      });
    }
    setTokens(fetchedTokens);
  };


  useEffect(() => {
    fetchTokens();
  }, []);

  const [selectedTokenId, setSelectedTokenId] = useState(null);

  const handleImageClick = (tokenId) => {
    setSelectedTokenId(tokenId === selectedTokenId ? null : tokenId);
  };

  const registerUser = async (event) => {
    event.preventDefault();

    // Request user account access
    await window.ethereum.request({ method: "eth_requestAccounts" });
    const usersContract = new ethers.Contract(usersContractAddress, UsersABI, signer);

    try {
      const tx = await usersContract.registerUser(walletAddress, name, email, imageURI);
      await tx.wait();
      alert("User registered successfully!");
      fetchTokens();
    } catch (err) {
      alert("Failed to register user.");
      console.error(err);
    }
  };

  const rewardUser = async (walletAddress, amount) => {
    try {
      const signer = provider.getSigner();
      const usersContract = new ethers.Contract(usersContractAddress, UsersABI, signer);
      const parsedAmount = ethers.utils.parseUnits(amount, 18);
      const tx = await usersContract.reward(walletAddress, parsedAmount);
      await tx.wait();
      alert("User rewarded successfully!");
    } catch (err) {
      alert("Failed to reward user.");
      console.error(err);
    }
  };
  
  

  const redeemTokens = async () => {
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      await provider.send("eth_requestAccounts", []);
      const signer = provider.getSigner()
      const tokenContract = new ethers.Contract(tokenAddress, tokenABI, signer);
      const parsedAmount = ethers.utils.parseUnits(redeemAmount, "ether");
      const tx = await tokenContract.redeem(parsedAmount);
      await tx.wait();
      alert("Redeemed successfully!");
    } catch (err) {
      alert("Failed to redeem.");
      console.error(err);
    }
  }

  const openReg = () => {
    setOpenRegister(true)
  }

  const closeReg = () => {
    setOpenRegister(false)
  }

  return (
    <div className="App">
      <h1>Users</h1>
      <button className="connect" onClick={connect}>
        {!connected && (
          <p>connect</p>
        )}
        {connected && (
          <p>connected</p>
        )}
      </button>

      {connected && (
        <div className="balance">
          <p>LAW Balance: {ethers.utils.formatEther(balance).toString()}</p>
        </div>
      )}

      <button className="register" onClick={openReg}>Register User</button>
      <button className="redeem" onClick={redeemTokens}>Redeem Tokens</button>
      <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Amount"
                    value={redeemAmount}
                    onChange={(e) => setRedeemAmount(e.target.value)}
                  />
      <div className="token-container">
        {tokens.map((token) => (
          <div className="allImgs" key={token.tokenId}>
            <div
              className="imgCont"
              dangerouslySetInnerHTML={{ __html: token.svg }}
              style={{ width: "200px", height: "200px", cursor: "pointer" }}
              onClick={() => handleImageClick(token.tokenId)}
            />
            {selectedTokenId === token.tokenId && (
              <div className="details">
                <div className="detailsContainer">
                  <h2>{token.name}</h2>
                  <p>Email: {token.email}</p>
                  <p>Wallet Address: {token.walletAddress}</p>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Reward Amount"
                    value={rewardAmount}
                    onChange={(e) => setRewardAmount(e.target.value)}
                    style={{transform: "translateY(3px)"}}
                  />
                  <button onClick={() => rewardUser(token.walletAddress, rewardAmount)}>Reward</button>
                <div>
                <button onClick={handleImageClick}>close</button>
                </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>

      {openRegister && (
        <div className="registerUser">
          <div className="regCont">
            <h1>Register</h1>
            <form onSubmit={registerUser}>
              <div>
                <input placeholder="name" type="text" value={name} onChange={(e) => setName(e.target.value)} />
              </div>

              <div>
                <input
                  type="text"
                  placeholder="Address"
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                />
              </div>
              <div>
                <input placeholder="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              </div>
              <div>

                <input placeholder="image link" type="text" value={imageURI} onChange={(e) => setImageURI(e.target.value)} />
              </div>
              <button type="submit">Register</button>
            </form>
            <button className="closeUser" onClick={closeReg}>close</button>
          </div>
        </div>
      )}


    </div>
  );
}

export default App;
