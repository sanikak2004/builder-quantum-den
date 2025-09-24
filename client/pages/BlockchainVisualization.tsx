import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Progress } from '../components/ui/progress';
import { toast } from 'sonner';
import { 
  Activity, Blocks, Coins, Database, TrendingUp, Zap, Clock, Hash, Users, Send, Eye, RotateCcw, Play, CheckCircle
} from 'lucide-react';

interface BlockchainStats {
  totalBlocks: number;
  totalTransactions: number;
  pendingTransactions: number;
  difficulty: number;
  totalSupply: number;
  miningReward: number;
  gasPrice: number;
  averageBlockTime: number;
  latestBlockHash: string;
  isValid: boolean;
  isMining: boolean;
  uniqueAddresses: number;
  networkHashRate: string;
}

interface Transaction {
  id: string;
  from: string;
  to: string;
  amount: number;
  data: any;
  timestamp: number;
  signature: string;
  fee: number;
}

interface Block {
  index: number;
  timestamp: number;
  transactions: Transaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  merkleRoot: string;
  validator: string;
  gasUsed: number;
  gasLimit: number;
}

const BlockchainVisualization: React.FC = () => {
  const [stats, setStats] = useState<BlockchainStats | null>(null);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [pendingTxs, setPendingTxs] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [selectedBlock, setSelectedBlock] = useState<Block | null>(null);
  
  // Transaction form state
  const [txForm, setTxForm] = useState({
    from: 'genesis',
    to: '',
    amount: 0,
    message: ''
  });

  // Fetch all data
  const fetchData = async () => {
    await Promise.all([fetchStats(), fetchBlockchain(), fetchPendingTxs()]);
  };

  // Fetch blockchain stats
  const fetchStats = async () => {
    try {
      const response = await fetch('/api/blockchain/custom/stats');
      const data = await response.json();
      if (data.success) {
        setStats(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  // Fetch blockchain data
  const fetchBlockchain = async () => {
    try {
      const response = await fetch('/api/blockchain/custom/chain');
      const data = await response.json();
      if (data.success) {
        setBlocks(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch blockchain:', error);
    }
  };

  // Fetch pending transactions
  const fetchPendingTxs = async () => {
    try {
      const response = await fetch('/api/blockchain/custom/pending');
      const data = await response.json();
      if (data.success) {
        setPendingTxs(data.data);
      }
    } catch (error) {
      console.error('Failed to fetch pending transactions:', error);
    }
  };

  // Create transaction
  const createTransaction = async () => {
    if (!txForm.to || txForm.amount <= 0) {
      toast.error('Please fill all required fields');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/blockchain/custom/transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: txForm.from,
          to: txForm.to,
          amount: txForm.amount,
          data: { message: txForm.message, type: 'demo' }
        })
      });

      const data = await response.json();
      if (data.success) {
        toast.success('Transaction created successfully!');
        setTxForm({ from: 'genesis', to: '', amount: 0, message: '' });
        await fetchData();
      } else {
        toast.error(data.error || 'Transaction failed');
      }
    } catch (error) {
      toast.error('Failed to create transaction');
    } finally {
      setLoading(false);
    }
  };

  // Mine block manually
  const mineBlock = async () => {
    if (pendingTxs.length === 0) {
      toast.error('No pending transactions to mine');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/blockchain/custom/mine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ minerAddress: 'manual_miner' })
      });

      const data = await response.json();
      if (data.success) {
        toast.success(`Block ${data.data.index} mined successfully!`);
        await fetchData();
      } else {
        toast.error(data.error || 'Mining failed');
      }
    } catch (error) {
      toast.error('Mining failed');
    } finally {
      setLoading(false);
    }
  };

  // Validate blockchain
  const validateBlockchain = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/blockchain/custom/validate');
      const data = await response.json();
      if (data.success) {
        if (data.data.isValid) {
          toast.success('Blockchain is valid!');
        } else {
          toast.error('Blockchain validation failed!');
        }
        await fetchStats();
      } else {
        toast.error(data.error || 'Validation failed');
      }
    } catch (error) {
      toast.error('Validation failed');
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh effect
  useEffect(() => {
    fetchData();
    
    if (autoRefresh) {
      const interval = setInterval(fetchData, 10000); // Refresh every 10 seconds
      return () => clearInterval(interval);
    }
  }, [autoRefresh]);

  // Helper functions
  const formatHash = (hash: string) => `${hash.slice(0, 8)}...${hash.slice(-8)}`;
  const formatTimestamp = (timestamp: number) => new Date(timestamp).toLocaleString();

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Blockchain Explorer</h1>
          <p className="text-muted-foreground">
            Real-time blockchain visualization and management
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            onClick={fetchData}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <RotateCcw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            onClick={() => setAutoRefresh(!autoRefresh)}
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
          >
            <Activity className="h-4 w-4 mr-2" />
            {autoRefresh ? 'Auto-Refresh ON' : 'Auto-Refresh OFF'}
          </Button>
          <Button
            onClick={validateBlockchain}
            variant="outline"
            size="sm"
            disabled={loading}
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            Validate
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats && (
          <>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Blocks</CardTitle>
                <Blocks className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalBlocks}</div>
                <p className="text-xs text-muted-foreground">
                  +{stats.averageBlockTime.toFixed(2)}ms avg time
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Transactions</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.totalTransactions}</div>
                <p className="text-xs text-muted-foreground">
                  {stats.pendingTransactions} pending
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Mining</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">Difficulty {stats.difficulty}</div>
                <div className="flex items-center gap-2 mt-1">
                  <Badge variant={stats.isMining ? "default" : "secondary"}>
                    {stats.isMining ? 'Mining' : 'Idle'}
                  </Badge>
                  <span className="text-xs text-muted-foreground">{stats.networkHashRate}</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Network</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.uniqueAddresses}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Active addresses
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Main Content Tabs */}
      <Tabs defaultValue="blocks" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="blocks">Blocks</TabsTrigger>
          <TabsTrigger value="transactions">Transactions</TabsTrigger>
          <TabsTrigger value="create">Create TX</TabsTrigger>
          <TabsTrigger value="mining">Mining</TabsTrigger>
        </TabsList>

        {/* Blocks Tab */}
        <TabsContent value="blocks" className="space-y-4">
          <div className="grid gap-4">
            {blocks.map((block) => (
              <Card key={block.index} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedBlock(block)}>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <CardTitle className="text-lg">Block #{block.index}</CardTitle>
                    <Badge variant="outline">
                      {block.transactions.length} TXs
                    </Badge>
                  </div>
                  <CardDescription>
                    Mined by {block.validator} • {formatTimestamp(block.timestamp)}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <Label>Block Hash</Label>
                      <code className="block text-xs bg-gray-100 p-1 rounded mt-1">
                        {formatHash(block.hash)}
                      </code>
                    </div>
                    <div>
                      <Label>Previous Hash</Label>
                      <code className="block text-xs bg-gray-100 p-1 rounded mt-1">
                        {formatHash(block.previousHash)}
                      </code>
                    </div>
                    <div>
                      <Label>Nonce</Label>
                      <div className="font-mono text-sm">{block.nonce}</div>
                    </div>
                  </div>
                  <div className="mt-3">
                    <Label>Gas Usage</Label>
                    <Progress value={(block.gasUsed / block.gasLimit) * 100} className="mt-1" />
                    <div className="text-xs text-muted-foreground mt-1">
                      {block.gasUsed.toLocaleString()} / {block.gasLimit.toLocaleString()} gas
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Transactions Tab */}
        <TabsContent value="transactions" className="space-y-4">
          <div className="grid gap-2">
            <h3 className="text-lg font-semibold">Pending Transactions ({pendingTxs.length})</h3>
            {pendingTxs.length > 0 ? (
              pendingTxs.map((tx) => (
                <Card key={tx.id}>
                  <CardContent className="pt-4">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <Label>From</Label>
                        <div className="font-mono text-xs">{tx.from}</div>
                      </div>
                      <div>
                        <Label>To</Label>
                        <div className="font-mono text-xs">{tx.to}</div>
                      </div>
                      <div>
                        <Label>Amount</Label>
                        <div className="font-bold">{tx.amount} ALT</div>
                      </div>
                      <div>
                        <Label>Fee</Label>
                        <div className="text-sm">{tx.fee} ALT</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              <Card>
                <CardContent className="pt-6 text-center text-muted-foreground">
                  No pending transactions
                </CardContent>
              </Card>
            )}
            
            {pendingTxs.length > 0 && (
              <Button onClick={mineBlock} disabled={loading} className="w-full">
                <Play className="h-4 w-4 mr-2" />
                {loading ? 'Mining...' : `Mine Block with ${pendingTxs.length} Transactions`}
              </Button>
            )}
          </div>
        </TabsContent>

        {/* Create Transaction Tab */}
        <TabsContent value="create" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Create New Transaction</CardTitle>
              <CardDescription>
                Create a new transaction to add to the blockchain
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="from">From Address</Label>
                  <Input
                    id="from"
                    value={txForm.from}
                    onChange={(e) => setTxForm({...txForm, from: e.target.value})}
                    placeholder="Sender address"
                  />
                </div>
                <div>
                  <Label htmlFor="to">To Address</Label>
                  <Input
                    id="to"
                    value={txForm.to}
                    onChange={(e) => setTxForm({...txForm, to: e.target.value})}
                    placeholder="Recipient address"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="amount">Amount (ALT)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={txForm.amount}
                  onChange={(e) => setTxForm({...txForm, amount: parseFloat(e.target.value) || 0})}
                  placeholder="Amount to send"
                />
              </div>
              <div>
                <Label htmlFor="message">Message (Optional)</Label>
                <Textarea
                  id="message"
                  value={txForm.message}
                  onChange={(e) => setTxForm({...txForm, message: e.target.value})}
                  placeholder="Transaction message"
                />
              </div>
              <Button onClick={createTransaction} disabled={loading} className="w-full">
                <Send className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Create Transaction'}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Mining Tab */}
        <TabsContent value="mining" className="space-y-4">
          <div className="grid gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Mining Information</CardTitle>
              </CardHeader>
              <CardContent>
                {stats && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Current Difficulty</Label>
                      <div className="text-2xl font-bold">{stats.difficulty}</div>
                    </div>
                    <div>
                      <Label>Mining Reward</Label>
                      <div className="text-2xl font-bold">{stats.miningReward} ALT</div>
                    </div>
                    <div>
                      <Label>Gas Price</Label>
                      <div className="text-2xl font-bold">{stats.gasPrice} ALT</div>
                    </div>
                    <div>
                      <Label>Network Hash Rate</Label>
                      <div className="text-2xl font-bold">{stats.networkHashRate}</div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Manual Mining</CardTitle>
                <CardDescription>
                  Mine pending transactions manually
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span>Pending Transactions:</span>
                    <Badge variant="outline">{pendingTxs.length}</Badge>
                  </div>
                  <Button 
                    onClick={mineBlock} 
                    disabled={loading || pendingTxs.length === 0} 
                    className="w-full"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    {loading ? 'Mining...' : 'Mine Block Now'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>

      {/* Selected Block Modal */}
      {selectedBlock && (
        <Card className="mt-6 border-2 border-blue-200">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>Block #{selectedBlock.index} Details</CardTitle>
              <Button variant="outline" size="sm" onClick={() => setSelectedBlock(null)}>
                <Eye className="h-4 w-4 mr-2" />
                Close
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Block Hash</Label>
                <code className="block text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                  {selectedBlock.hash}
                </code>
              </div>
              <div>
                <Label>Previous Hash</Label>
                <code className="block text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                  {selectedBlock.previousHash}
                </code>
              </div>
              <div>
                <Label>Merkle Root</Label>
                <code className="block text-xs bg-gray-100 p-2 rounded mt-1 break-all">
                  {selectedBlock.merkleRoot}
                </code>
              </div>
              <div>
                <Label>Validator</Label>
                <div className="text-sm mt-1">{selectedBlock.validator}</div>
              </div>
            </div>
            
            <div className="mt-4">
              <Label>Transactions ({selectedBlock.transactions.length})</Label>
              <div className="mt-2 space-y-2 max-h-60 overflow-y-auto">
                {selectedBlock.transactions.map((tx) => (
                  <div key={tx.id} className="p-2 bg-gray-50 rounded text-sm">
                    <div className="flex justify-between items-center">
                      <code className="text-xs">{formatHash(tx.id)}</code>
                      <span className="font-semibold">{tx.amount} ALT</span>
                    </div>
                    <div className="text-xs text-gray-600">
                      {tx.from} → {tx.to}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BlockchainVisualization;