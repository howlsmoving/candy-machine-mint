import { useEffect, useState } from "react";
import styled from "styled-components";
import Countdown from "react-countdown";
import { Button, CircularProgress, Snackbar } from "@material-ui/core";
import Alert from "@material-ui/lab/Alert";

import { createTheme } from '@material-ui/core/styles'

import * as anchor from "@project-serum/anchor";

import { LAMPORTS_PER_SOL } from "@solana/web3.js";

import { useAnchorWallet } from "@solana/wallet-adapter-react";
import { WalletDialogButton } from "@solana/wallet-adapter-material-ui";

import Logo from './images/CCLogo.png'
import Display from './images/chicksgif.gif'

import Accordion from './Components/Accordion';


import {
  CandyMachine,
  awaitTransactionSignatureConfirmation,
  getCandyMachineState,
  mintOneToken,
  shortenAddress,
} from "./candy-machine";

const theme = createTheme({
  palette: {
    primary: {
      main: '#ee9b00'
    }
  },  
})


const ConnectButton = styled(WalletDialogButton)`
font-size: 3rem;

`;

const CounterText = styled.span``; // add your styles here

const MintContainer = styled.div``; // add your styles here

const MintButton = (Button)

export interface HomeProps {
  candyMachineId: anchor.web3.PublicKey;
  config: anchor.web3.PublicKey;
  connection: anchor.web3.Connection;
  startDate: number;
  treasury: anchor.web3.PublicKey;
  txTimeout: number;
}

const Home = (props: HomeProps) => {
  const [balance, setBalance] = useState<number>();
  const [isActive, setIsActive] = useState(false); // true when countdown completes
  const [isSoldOut, setIsSoldOut] = useState(false); // true when items remaining is zero
  const [isMinting, setIsMinting] = useState(false); // true when user got to press MINT

  const [itemsAvailable, setItemsAvailable] = useState(0);
  const [itemsRedeemed, setItemsRedeemed] = useState(0);
  const [itemsRemaining, setItemsRemaining] = useState(0);

  const [alertState, setAlertState] = useState<AlertState>({
    open: false,
    message: "",
    severity: undefined,
  });

  const [startDate, setStartDate] = useState(new Date(props.startDate));

  const wallet = useAnchorWallet();
  const [candyMachine, setCandyMachine] = useState<CandyMachine>();





  const refreshCandyMachineState = () => {
    (async () => {
      if (!wallet) return;

      const {
        candyMachine,
        goLiveDate,
        itemsAvailable,
        itemsRemaining,
        itemsRedeemed,
      } = await getCandyMachineState(
        wallet as anchor.Wallet,
        props.candyMachineId,
        props.connection
      );

      setItemsAvailable(itemsAvailable);
      setItemsRemaining(itemsRemaining);
      setItemsRedeemed(itemsRedeemed);

      setIsSoldOut(itemsRemaining === 0);
      setStartDate(goLiveDate);
      setCandyMachine(candyMachine);
    })();
  };

  const onMint = async () => {
    try {
      setIsMinting(true);
      if (wallet && candyMachine?.program) {
        const mintTxId = await mintOneToken(
          candyMachine,
          props.config,
          wallet.publicKey,
          props.treasury
        );

        const status = await awaitTransactionSignatureConfirmation(
          mintTxId,
          props.txTimeout,
          props.connection,
          "singleGossip",
          false
        );

        if (!status?.err) {
          setAlertState({
            open: true,
            message: "Congratulations! Mint succeeded!",
            severity: "success",
          });
        } else {
          setAlertState({
            open: true,
            message: "Mint failed! Please try again!",
            severity: "error",
          });
        }
      }
    } catch (error: any) {
      // TODO: blech:
      let message = error.msg || "Minting failed! Please try again!";
      if (!error.msg) {
        if (error.message.indexOf("0x138")) {
        } else if (error.message.indexOf("0x137")) {
          message = `SOLD OUT!`;
        } else if (error.message.indexOf("0x135")) {
          message = `Insufficient funds to mint. Please fund your wallet.`;
        }
      } else {
        if (error.code === 311) {
          message = `SOLD OUT!`;
          setIsSoldOut(true);
        } else if (error.code === 312) {
          message = `Minting period hasn't started yet.`;
        }
      }

      setAlertState({
        open: true,
        message,
        severity: "error",
      });
    } finally {
      if (wallet) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
      setIsMinting(false);
      refreshCandyMachineState();
    }
  };

  useEffect(() => {
    (async () => {
      if (wallet) {
        const balance = await props.connection.getBalance(wallet.publicKey);
        setBalance(balance / LAMPORTS_PER_SOL);
      }
    })();
  }, [wallet, props.connection]);

  useEffect(refreshCandyMachineState, [
    wallet,
    props.candyMachineId,
    props.connection,
  ]);


  return (
    <main className="bg-repeat bg-chicks-pattern flex overflow-hidden flex-col font-lora items-center jusify-center min-h-screen py-2 pt-6">
    <div className="lg:w-1/2 md:w-3/4 w-6/7">
      <nav className="h-24 mb-12 px-4 pr-12 w-full">
          <div className="flex justify-between space-x-12">
            <a href='https://chubbychicks.art/' className="justify-start">
              <img className="filter drop-shadow-lg" src={Logo} height={240} width={240} alt="logo"></img>
            </a>
              <button className="filter drop-shadow-xl rounded-full bg-mublue text-xl my-10 px-6">
            <a className="" href="https://solanart.io/">
              {/* <img alt="menu" src="https://img.icons8.com/material-outlined/24/ffffff/menu--v1.png"/> */}
              <p className="text-sm font-bold text-white">Buy on Solanart </p>
            </a>
              </button>
            
          </div>
        </nav>
        <div className="flex justify-center">
          <img className="h-auto w-3/4 md:w-1/2 pointer-events-none" src={Display} alt="NFT"/>
        </div>
        
        <article className="w-full mt-6 px-4"> 
          <div className="bg-muwhite border-4 border-mupink border-opacity-50 filter drop-shadow-xl rounded-2xl text-xl px-2 py-4">

          {
            !wallet? (
              <div className="text-center font-bold filter drop-shadow-md">
                <p>Connect wallet to mint</p>
                <p>Price: 0.25 SOL</p>
                <p className="pt-4 text-3xl text-center">LAUNCH DATE: FRIDAY 19, 2021</p>
                </div>
            ) : (
              <div className="text-center">
                <p className="text-sm">{new Date().toLocaleString('en-US', {weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'}) + ''}</p>
                {wallet && <p className="text-4xl">Chicks Remaining: {itemsRemaining}</p>}
                {wallet && <p className="text-3xl">Total Available: {itemsAvailable}</p>}
                        {wallet && (
                          <p>Linked wallet: {shortenAddress(wallet.publicKey.toBase58() || "")}</p>
                        )}

                        {wallet && <p>Balance: {(balance || 0).toLocaleString()} SOL</p>}


                        {/* {wallet && <p>Redeemed: {itemsRedeemed}</p>} */}

              </div>
            )
          }

    <div className="flex justify-center m-6">
      <MintContainer>
        {!wallet ? (
          <div className="my-4">
            <ConnectButton>Connect Wallet</ConnectButton>
          </div>
        ) : (
          <button
            disabled={isSoldOut || isMinting || !isActive}
            onClick={onMint}
            className="filter drop-shadow-xl bg-yellow-200 hover:bg-muyellow text-5xl text-black font-bold py-4 px-20 rounded-md animate-bounce'"
          >
            {isSoldOut ? (
              "SOLD OUT"
            ) : isActive ? (
              isMinting ? (
                <CircularProgress />
              ) : (
                "MINT"
              )
            ) : (
              <Countdown
                date={startDate}
                onMount={({ completed }) => completed && setIsActive(true)}
                onComplete={() => setIsActive(true)}
                renderer={renderCounter}
              />
            )}
          </button>
        )}
      </MintContainer>
    </div>


    <Accordion 
    title={<p className="text-2xl filter drop-shadow-md font-bold px-10">Info</p>}
    content={<div className="text-justify px-6"> 
        <p>WIP</p>
    </div>}
    />
        {/* <Accordion 
    title={<p className="text-2xl font-bold drop-shadow-md px-10">Team</p>}
    content={<div className="text-justify px-6">
            <h1 className="font-bold">
      Who was responsible for the Chubby Chicks hatching?

      </h1>
      <p>
      Chubby Chicks NFT team are a group of technology specialists from Sydney, Australia, with a focus on creating great tech on digital ecosystems.
      </p>
      </div>}
    /> */}
        <Accordion 
    title={<p className="text-2xl font-bold drop-shadow-md px-10">FAQ</p>}
    content={<div className="text-justify px-6">
      <h1 className="font-bold">What is Chubby Chicks NFT?</h1>
      <p className="border-b-2 pb-2 border-gray-400">The cutest (and chubbiest) barn-generated chicks. Exclusive hatch on Solana.</p>
      <h1 className="font-bold" >Where can I see my Chubby Chicks NFT?</h1>
      <p className="border-b-2 pb-2 border-gray-400">Your Chubby Chicks purchase will be sent to the wallet you made your purchase with.</p>
      <h1 className="font-bold">What Solana wallets can I use?</h1>
      <p className="border-b-2 pb-2 border-gray-400">Chubby Chicks supports Phantom and Sollet wallets at launch.</p>
      <h1 className="font-bold">What can I do with my Chubby Chicks NFT?</h1>
      <p className="border-b-2 pb-2 border-gray-400">Once you’ve purchased your Chubby Chick, you own the licensing rights to the intellectual property of that particular Chubby Chick, so do what you like with it!

Please note, once you sell your Chubby Chick, you also hand the rights over to the new owner.
‍
Owning a Chubby Chick does not give you ownership of Chubby Chicks brand, logo, names site images or other marketing material.
‍
You own your Chubby Chick NFT, not Chubby Chicks as a part or whole brand. Please accurately represent yourself / brand / product, while not infringing on Chubby Chicks brand.
</p>
      <h1 className="font-bold">How were the Chubby Chicks hatched?</h1>
      <p className="border-b-2 pb-2 border-gray-400">Each element of Chubby Chicks have been hand-illustrated, hand-vectorized and algorithmically generated using custom code. There are many unqiue attributes including body shape, eyes, hair, beak, shell fragments, top clothing, bottom clothing, random inclusions and others.
      </p>
      <h1 className="font-bold">
      Will all Chubby Chicks be sold?

      </h1>
      <p className="border-b-2 pb-2 border-gray-400">
      Up to 100 Chubby Chicks are reserved for early community engagement, giveaways and contributor airdrops. Most will be issued immediately after launch.

      </p>
      <h1 className="font-bold">
      What other NFT projects are you affiliated with?

      </h1>
      <p className="border-b-2 pb-2 border-gray-400">
      None, but we have a lot of love for other creators. Hat tip to the Step.Finance and Sollamas team.

      </p>
      <h1 className="font-bold">
      What are the resale royalties?

      </h1>
      <p className="border-b-2 pb-2 border-gray-400">
      5%, used to fund future development.
</p>
      </div>
      }
    />
        <Accordion 
    title={<p className="text-2xl font-bold drop-shadow-md px-10">Roadmap</p>}
    content={<div className="text-justify px-6">
      <h1 className="font-bold">What's on the Chubby Chicks roadmap?
</h1>
<p className="">
1. Hatch: Mint and Launch of the Chubby Chicks NFT collection <br />
2. Marketplace: Buy, Sell and Trade <br />
3. Chubby Chicks Holders Private Community Launch <br />
4. Private Community Voting on our next exciting plans <br />

</p>
      </div>
      }
    />
        </div>

        




      <Snackbar
        open={alertState.open}
        autoHideDuration={6000}
        onClose={() => setAlertState({ ...alertState, open: false })}
      >
        <Alert
          onClose={() => setAlertState({ ...alertState, open: false })}
          severity={alertState.severity}
        >
          {alertState.message}
        </Alert>
      </Snackbar>

      </article>
      <footer className="flex w-full p-6 px-12 justify-center items-center">
        <div className="flex-auto">
          <a className="" href="https://twitter.com/ChubbyChicksNFT">
          <img className="h-8" alt="twitter" src="https://img.icons8.com/ios/50/ffffff/twitter--v1.png"/>
          </a>
        </div>
        <div className="flex">
          <a className="" href="https://discord.gg/uumf6zjvaX">
          <img className="h-8" alt='discord' src="https://img.icons8.com/ios/50/ffffff/discord-logo--v1.png"/>
          </a>
        </div>
      </footer>
      </div>
    </main>
  );
};

interface AlertState {
  open: boolean;
  message: string;
  severity: "success" | "info" | "warning" | "error" | undefined;
}

const renderCounter = ({ days, hours, minutes, seconds, completed }: any) => {
  return (
    <CounterText>
      {hours + (days || 0) * 24} hours, {minutes} minutes, {seconds} seconds
    </CounterText>
  );
};

export default Home;
