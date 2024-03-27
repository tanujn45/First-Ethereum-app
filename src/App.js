import React, { useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import abi from "./utils/WavePortal.json";

const getEthereumObject = () => window.ethereum;

export default function App() {
  const [currentAccount, setCurrentAccount] = React.useState("");

  const [allWaves, setAllWaves] = React.useState([]);

  const contractAddress = "0x47E7ead63474cEad996DA6B7aCEe2657896c1c37";
  const contractABI = abi.abi;

  const checkIfWalletIsConnected = async () => {
    try {
      const ethereum = getEthereumObject();

      if (!ethereum) {
        console.error("Make sure you have MetaMask!");
        return null;
      }

      console.log("We have the Ethereum object", ethereum);
      const accounts = await ethereum.request({ method: "eth_accounts" });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log("Found an authorized account:", account);
        setCurrentAccount(account);
        getAllWaves();
      } else {
        console.log("No authorized account found");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const connectWallet = async () => {
    try {
      const ethereum = getEthereumObject();
      if (!ethereum) {
        alert("Get MetaMask!");
        return;
      }

      const accounts = await ethereum.request({
        method: "eth_requestAccounts",
      });

      console.log("Connected", accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    checkIfWalletIsConnected();
  }, []);

  const getAllWaves = async () => {
    try {
      const { ethereum } = window;
      if (ethereum) {
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const waves = await wavePortalContract.getAllWaves();

        let wavesCleaned = [];
        waves.forEach((wave) => {
          wavesCleaned.push({
            address: wave.waver,
            timestamp: new Date(Number(wave.timestamp) * 1000),
            message: wave.message,
          });
        });

        setAllWaves(wavesCleaned);
      }
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log("NewWave", from, timestamp, message);
      setAllWaves((prevState) => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(Number(timestamp) * 1000),
          message: message,
        },
      ]);
    };

    (async () => {
      if (window.ethereum) {
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();

        wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        wavePortalContract.on("NewWave", onNewWave);
      }
    })();

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off("NewWave", onNewWave);
      }
    };
  }, []);

  const wave = async () => {
    try {
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.BrowserProvider(ethereum);
        const signer = await provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        let count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count);

        const waveTxn = await wavePortalContract.wave(
          "Hello, this is my first message!"
        );
        console.log("Mining...", waveTxn.hash);

        await waveTxn.wait();
        console.log("Mined -- ", waveTxn.hash);

        count = await wavePortalContract.getTotalWaves();
        console.log("Retrieved total wave count...", count);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <section className="wavePortal py-5">
      <div className="container">
        <div className="col-lg-8 mx-lg-auto mx-3">
          <h1 className="heading">
            <span class="gradient">Decentralized</span>{" "}
            <span class="solid-blue">Dialogue</span>
          </h1>
          <div className="intro-text">
            I am <span className="solid-blue">Tanuj</span> and I am on a path to
            learn <span className="solid-red">Web3</span>!
          </div>
          <div className="intro-text py-3">
            Drop me a line on the blockchain - your words encrypted, your
            message immortalized in the digital ether. Let's chat, encrypted and
            unstoppable.
          </div>

          <textarea
            className="message-box mb-3 p-3"
            rows="5"
            placeholder="Speak your vibe here - type it, send it, own it."
          />

          <div className="d-flex justify-content-center align-items-center">
            <button className="btn-style mx-3 mb-5" onClick={wave}>
              Quantum Send
            </button>

            {!currentAccount && (
              <button className="btn-style mx-3 mb-5" onClick={connectWallet}>
                Connect Wallet
              </button>
            )}
          </div>

          {allWaves.map((wave, index) => {
            return (
              <div key={index} className="message-box p-4 mb-4">
                <div className="intro-text mb-5">{wave.message}</div>
                <div className="time mt-1">{wave.timestamp.toString()}</div>
                <div className="address">{wave.address}</div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
