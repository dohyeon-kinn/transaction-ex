import * as bitcoin from 'bitcoinjs-lib';
import * as bip39 from 'bip39';
import * as ecc from 'tiny-secp256k1';
import BIP32Factory from 'bip32';

const BTC = 100_000_000;
const bip32 = BIP32Factory(ecc);

// 1. Mnemonic 생성
const mnemonic = bip39.generateMnemonic();
console.log('1️⃣ Mnemonic:', mnemonic);

// 2. Mnemonic 으로부터 Private key 생성
const seed = bip39.mnemonicToSeedSync(mnemonic);
const root = bip32.fromSeed(seed);
const path = "m/44'/0'/0'/0/0";
const child = root.derivePath(path);
const privateKey = child.privateKey?.toString('hex');
console.log('2️⃣ Private Key:', privateKey);

// 3. Private Key로부터 Public Key 생성
const publicKey = child.publicKey.toString('hex');
console.log('3️⃣ Public Key:', publicKey);

// 4. Public Key로부터 Address 생성
const segwitAddress = bitcoin.payments.p2wpkh({ 
  pubkey: child.publicKey,
  network: bitcoin.networks.bitcoin 
}).address;

// balance 조회
const balanceResponse = await fetch(`https://mempool.space/api/address/${address}`);
const data = await balanceResponse.json();
const balance = data.chain_stats.funded_txo_sum - data.chain_stats.spent_txo_sum;
console.log('잔액 (BTC):', balance / 100000000);
        
// UTXO 조회
const utxoResponse = await fetch(`https://mempool.space/api/address/${address}/utxo`);
const utxos = await utxoResponse.json();
console.log('UTXOs:', utxos);

// 5. Transaction 생성
const psbt = new bitcoin.Psbt({ network: bitcoin.networks.bitcoin });
utxos.forEach(utxo => {
    psbt.addInput({
        hash: utxo.txid,
        index: utxo.vout,
        witnessUtxo: {
            script: Buffer.from(utxo.scriptPubKey, 'hex'),
            value: utxo.value,
        },
    });
});

psbt.addOutput({
    address: '0x~~~~~~~~',
    value: 1 * BTC,
});
psbt.signAllInputs(bitcoin.ECPair.fromPrivateKey(Buffer.from(privateKey, 'hex')));
psbt.finalizeAllInputs();
const tx = psbt.extractTransaction().toHex();
console.log('Transaction:', tx);