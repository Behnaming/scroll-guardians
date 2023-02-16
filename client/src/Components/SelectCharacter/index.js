import React, { useEffect, useState } from 'react';
import './SelectCharacter.css';
import { ethers } from 'ethers';
import { CONTRACT_ADDRESS, transformCharacterData } from '../../constants';
import ScrollGuardians from '../../utils/ScrollGuardians.json';
import LoadingIndicator from "../../Components/LoadingIndicator";

const SelectCharacter = ({ setCharacterNFT }) => {
    const [characters, setCharacters] = useState([]);
    const [gameContract, setGameContract] = useState(null);
    const [mintingCharacter, setMintingCharacter] = useState(false);

    // Actions
    const mintCharacterNFTAction = async (characterId) => {
        try {
            if (gameContract) {
                setMintingCharacter(true);
                console.log('Minting character in progress...');
                const mintTxn = await gameContract.mintCharacterNFT(characterId);
                await mintTxn.wait();
                console.log('mintTxn:', mintTxn);
                setMintingCharacter(false);
            }
        } catch (error) {
            console.warn('MintCharacterAction Error:', error);
            setMintingCharacter(false);
        }
    };

    // UseEffect
    useEffect(() => {
        const { ethereum } = window;
  
        if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const gameContract = new ethers.Contract(
            CONTRACT_ADDRESS,
            ScrollGuardians.abi,
            signer
        );
    
        /*
        * This is the big difference. Set our gameContract in state.
        */
        setGameContract(gameContract);
        } else {
        console.log('Ethereum object not found');
        }
    }, []);

    useEffect(() => {
        const getCharacters = async () => {
          try {
            console.log('Getting contract characters to mint');
      
            /*
             * Call contract to get all mint-able characters
             */
            const charactersTxn = await gameContract.getAllDefaultCharacters();
            console.log('charactersTxn:', charactersTxn);
      
            /*
             * Go through all of our characters and transform the data
             */
            const characters = charactersTxn.map((characterData) =>
              transformCharacterData(characterData)
            );
      
            /*
             * Set all mint-able characters in state
             */
            setCharacters(characters);
          } catch (error) {
            console.error('Something went wrong fetching characters:', error);
          }
        };
      
        /*
         * If our gameContract is ready, let's get characters!
         */
        if (gameContract) {
          getCharacters();
        }

        /*
         * Add a callback method that will fire when this event is received
         */
        const onCharacterMint = async (sender, tokenId, characterIndex) => {
            console.log(
            `CharacterNFTMinted - sender: ${sender} tokenId: ${tokenId.toNumber()} characterIndex: ${characterIndex.toNumber()}`
            );
            alert(`Your NFT is all done -- see it here: https://opensea.io/assets/arbitrum/${CONTRACT_ADDRESS}/${tokenId.toNumber()}`)


            /*
            * Once our character NFT is minted we can fetch the metadata from our contract
            * and set it in state to move onto the Arena
            */
            if (gameContract) {
                const characterNFT = await gameContract.checkIfUserHasNFT();
                console.log('CharacterNFT: ', characterNFT);
                setCharacterNFT(transformCharacterData(characterNFT));
            }
        };

        if (gameContract) {
            getCharacters();

            /*
            * Setup NFT Minted Listener
            */
            gameContract.on('CharacterNFTMinted', onCharacterMint);
        }

        return () => {
            /*
            * When your component unmounts, let's make sure to clean up this listener
            */
            if (gameContract) {
            gameContract.off('CharacterNFTMinted', onCharacterMint);
            }
        };
    }, [gameContract]);

    // Render Methods
    const renderCharacters = () =>
    characters.map((character, index) => (
    <div className="character-item" key={character.name}>
        <div className="name-container">
        <p>{character.name}</p>
        </div>
        <img src={`https://cloudflare-ipfs.com/ipfs/${character.imageURI}`} alt={character.name} />
        <button
        type="button"
        className="character-mint-button"
        onClick={()=> mintCharacterNFTAction(index)}
        >{`Mint ${character.name}`}</button>
    </div>
    ));
  
    return (
        <div className="select-character-container">
            <h2>Mint Your Guardian. Choose wisely.</h2>
            {/* Only show this when there are characters in state */}
            {characters.length > 0 && (
                <div className="character-grid">{renderCharacters()}</div>
            )}
            {/* Only show our loading state if mintingCharacter is true */}
            {mintingCharacter && (
                <div className="loading">
                    <div className="indicator">
                        <LoadingIndicator />
                        <p>Minting In Progress...</p>
                    </div>
                    <img
                    src="https://media2.giphy.com/media/61tYloUgq1eOk/giphy.gif?cid=ecf05e47dg95zbpabxhmhaksvoy8h526f96k4em0ndvx078s&rid=giphy.gif&ct=g"
                    alt="Minting loading indicator"
                    />
                </div>
            )}
        </div>
    );
};

export default SelectCharacter;