import { useState, useEffect, useCallback } from 'react';
import Web3 from 'web3';

declare global {
  interface Window {
    ethereum?: any;
    web3?: any;
  }
}

export interface WalletState {
  isConnected: boolean;
  address: string | null;
  chainId: number | null;
  balance: string | null;
  provider: string | null;
}

export interface UseWeb3Return {
  wallet: WalletState;
  connectWallet: (provider?: 'metamask' | 'walletconnect') => Promise<boolean>;
  disconnectWallet: () => void;
  signMessage: (message: string) => Promise<string | null>;
  isMetaMaskInstalled: boolean;
  error: string | null;
  isLoading: boolean;
}

export const useWeb3 = (): UseWeb3Return => {
  const [wallet, setWallet] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    balance: null,
    provider: null
  });
  
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [web3Instance, setWeb3Instance] = useState<Web3 | null>(null);

  // Check if MetaMask is installed
  const isMetaMaskInstalled = typeof window !== 'undefined' && typeof window.ethereum !== 'undefined';

  // Initialize Web3 connection
  const initializeWeb3 = useCallback(async () => {
    if (window.ethereum) {
      const web3 = new Web3(window.ethereum);
      setWeb3Instance(web3);
      
      // Check if already connected
      try {
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
          await updateWalletState(web3, accounts[0]);
        }
      } catch (error) {
        console.error('Failed to get accounts:', error);
      }
    }
  }, []);

  // Update wallet state
  const updateWalletState = useCallback(async (web3: Web3, address: string) => {
    try {
      const chainId = await web3.eth.getChainId();
      const balance = await web3.eth.getBalance(address);
      const balanceInEth = web3.utils.fromWei(balance, 'ether');

      setWallet({
        isConnected: true,
        address,
        chainId: Number(chainId),
        balance: parseFloat(balanceInEth).toFixed(4),
        provider: 'metamask'
      });
    } catch (error) {
      console.error('Failed to update wallet state:', error);
      setError('Failed to fetch wallet information');
    }
  }, []);

  // Connect wallet
  const connectWallet = useCallback(async (provider: 'metamask' | 'walletconnect' = 'metamask'): Promise<boolean> => {
    if (provider === 'metamask' && !isMetaMaskInstalled) {
      setError('MetaMask is not installed. Please install MetaMask to continue.');
      return false;
    }

    setIsLoading(true);
    setError(null);

    try {
      if (provider === 'metamask' && window.ethereum) {
        // Request account access
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        
        const web3 = new Web3(window.ethereum);
        setWeb3Instance(web3);
        
        const accounts = await web3.eth.getAccounts();
        if (accounts.length > 0) {
          await updateWalletState(web3, accounts[0]);
          return true;
        }
      }
      
      setError('Failed to connect wallet');
      return false;
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      if (error.code === 4001) {
        setError('Connection rejected by user');
      } else if (error.code === -32002) {
        setError('Connection request is already pending');
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
      
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [isMetaMaskInstalled, updateWalletState]);

  // Disconnect wallet
  const disconnectWallet = useCallback(() => {
    setWallet({
      isConnected: false,
      address: null,
      chainId: null,
      balance: null,
      provider: null
    });
    setWeb3Instance(null);
    setError(null);
  }, []);

  // Sign message
  const signMessage = useCallback(async (message: string): Promise<string | null> => {
    if (!web3Instance || !wallet.address) {
      setError('Wallet not connected');
      return null;
    }

    try {
      setIsLoading(true);
      setError(null);

      const signature = await web3Instance.eth.personal.sign(
        message,
        wallet.address,
        '' // Password (not needed for MetaMask)
      );

      return signature;
    } catch (error: any) {
      console.error('Message signing error:', error);
      
      if (error.code === 4001) {
        setError('Signature rejected by user');
      } else {
        setError('Failed to sign message');
      }
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [web3Instance, wallet.address]);

  // Set up event listeners for account and chain changes
  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = async (accounts: string[]) => {
      if (accounts.length === 0) {
        disconnectWallet();
      } else if (web3Instance) {
        await updateWalletState(web3Instance, accounts[0]);
      }
    };

    const handleChainChanged = (chainId: string) => {
      // Reload the page when chain changes to avoid any issues
      window.location.reload();
    };

    const handleDisconnect = () => {
      disconnectWallet();
    };

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
    window.ethereum.on('disconnect', handleDisconnect);

    return () => {
      if (window.ethereum.removeListener) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
        window.ethereum.removeListener('disconnect', handleDisconnect);
      }
    };
  }, [web3Instance, updateWalletState, disconnectWallet]);

  // Initialize on mount
  useEffect(() => {
    initializeWeb3();
  }, [initializeWeb3]);

  return {
    wallet,
    connectWallet,
    disconnectWallet,
    signMessage,
    isMetaMaskInstalled,
    error,
    isLoading
  };
};

// Utility functions for Web3
export const formatAddress = (address: string): string => {
  if (!address) return '';
  return `${address.substring(0, 6)}...${address.substring(address.length - 4)}`;
};

export const isValidAddress = (address: string): boolean => {
  return Web3.utils.isAddress(address);
};

export const getChainName = (chainId: number): string => {
  const chains: { [key: number]: string } = {
    1: 'Ethereum Mainnet',
    3: 'Ropsten Testnet',
    4: 'Rinkeby Testnet',
    5: 'Goerli Testnet',
    42: 'Kovan Testnet',
    56: 'Binance Smart Chain',
    137: 'Polygon Mainnet',
    80001: 'Polygon Mumbai',
    250: 'Fantom Opera',
    43114: 'Avalanche C-Chain',
    42161: 'Arbitrum One',
    10: 'Optimism'
  };
  
  return chains[chainId] || `Unknown Chain (${chainId})`;
};
