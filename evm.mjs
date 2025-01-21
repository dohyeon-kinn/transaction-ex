import { createPublicClient, createWalletClient, http, parseEther, parseGwei } from 'viem';
import { generateMnemonic, mnemonicToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

// 1. Mnemonic 생성
const mnemonic = generateMnemonic();
console.log('1️⃣ Mnemonic:', mnemonic);

// 2. Mnemonic으로부터 Account (Private Key 포함) 생성
const account = mnemonicToAccount(mnemonic);
console.log('2️⃣ Private Key:', account.privateKey);

// 3, 4. Public Key와 Address는 account 객체에 포함되어 있음
console.log('3️⃣ & 4️⃣ Address:', account.address);

// Public Client 생성 (네트워크 연결용)
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
});

// Wallet Client 생성 (트랜잭션 서명용)
const walletClient = createWalletClient({
  chain: mainnet,
  transport: http()
});

// 5. Transaction 생성 및 서명
const toAddress = '0x...'; // 받는 주소
const transaction = {
  to: toAddress,
  value: parseEther('1'),
  account: account,
  maxFeePerGas: parseGwei('50'),
  maxPriorityFeePerGas: parseGwei('2'),
  gasLimit: BigInt(21000)
};

// 트랜잭션 전송
const hash = await walletClient.sendTransaction(transaction);
console.log('Transaction Hash:', hash);

// 트랜잭션 상태 확인
const receipt = await publicClient.waitForTransactionReceipt({ hash });
console.log('Transaction Receipt:', receipt);

// Balance 조회
const balance = await publicClient.getBalance({
  address: account.address,
});
console.log('Balance:', balance);