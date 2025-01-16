import bip39 from 'bip39';
import { Transaction } from 'ethereumjs-tx';
import * as ethUtil from 'ethereumjs-util';
import { parseEther, parseUnits } from 'ethers';
import hdKey from 'hdkey';

// 1. Mnemonic 생성
const mnemonic = bip39.generateMnemonic();
console.log('1️⃣ Mnemonic:', mnemonic);

// 2. Mnemonic 으로부터 Private key 생성
const seed = bip39.mnemonicToSeedSync(mnemonic);
const root = hdKey.fromMasterSeed(seed);
const addrNode = root.derive("m/44'/60'/0'/0/0");
const privateKey = addrNode.privateKey;
console.log('2️⃣ Private Key:', privateKey);

// 3. Private Key로부터 Public Key 생성
const publicKey = ethUtil.privateToPublic(privateKey);
console.log('3️⃣ Public Key:', publicKey);

// 4. Public Key로부터 Address 생성
const address = `0x${ethUtil.publicToAddress(publicKey).toString('hex')}`;
console.log('4️⃣ Address:', address);

// 5. Transaction 생성
const toAddress = '0x';
const amountEther = parseEther('1');
const MAX_FEE_PER_GAS = parseUnits("50", "gwei");
const GAS_LIMIT = 2100;
const MAX_PRIORITY_FEE_PER_GAS = parseUnits("2", "gwei");

const txParams = {
    to: toAddress,
    value: amountEther,
    gasLimit: GAS_LIMIT,
    maxFeePerGas: MAX_FEE_PER_GAS,
    maxPriorityFeePerGas: MAX_PRIORITY_FEE_PER_GAS,
};

const tx = new Transaction(txParams, { chain: 'mainnet' });
tx.sign(privateKey);
const signedTx = `0x${tx.serialize().toString('hex')}`;

console.log('Transaction:', signedTx);

