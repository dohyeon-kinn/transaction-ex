import { secp256k1 } from '@noble/curves/secp256k1';
import { concatHex, createPublicClient, createWalletClient, http, keccak256, numberToHex, parseEther, toHex, toRlp } from 'viem';
import { generateMnemonic, mnemonicToAccount } from 'viem/accounts';
import { mainnet } from 'viem/chains';

// Mnemonic 생성
const mnemonic = generateMnemonic(256);

// Mnemonic으로부터 Account (Private Key 포함) 생성
const account = mnemonicToAccount(mnemonic);

// Public Client 생성 (네트워크 연결용)
const publicClient = createPublicClient({
  chain: mainnet,
  transport: http()
});

// EIP-1559 Transaction 생성
const transaction = {
  chainId: mainnet.id, // 네트워크 id
  account: account,
  to: '0x............이더리움 주소는 length 42',
  value: parseEther('1'),
  nonce: await publicClient.getTransactionCount({ address: account.address }), // 계정의 트랜잭션 수
  maxFeePerGas: await publicClient.estimateMaxFeePerGas(), // 가스 비용 상한
  maxPriorityFeePerGas: await publicClient.estimateMaxPriorityFeePerGas(), // 우선순위 가스 비용(채굴자에게)
  gasLimit: await publicClient.estimateGas(transaction),
  accessList: [ // 접근 가능한 주소 및 슬롯 정보
    {
      address: "0x1234567890abcdef1234567890abcdef12345678",
      storageKeys: [
        "0x0000000000000000000000000000000000000000000000000000000000000000",
        "0x0000000000000000000000000000000000000000000000000000000000000001"
      ]
    }
  ],
};

// serialize Transaction
const serializedAccessList = [];

for (let i = 0; i < transaction.accessList.length; i++) {
  const { address, storageKeys } = transaction.accessList[i]
  serializedAccessList.push([address, storageKeys])
}

const LEGACY = '0x00';
const EIP_2930 = '0x01';
const EIP_1559 = '0x02';

// RLP (Recursive Length Prefix) 사용하여 직렬화하고, HEX 값(16진수)으로 변환
const serializedTransaction = concatHex([
  EIP_1559,
  toRlp([
    toHex(mainnet.id),
    nonce ? toHex(transaction?.nonce) : '0x',
    maxPriorityFeePerGas ? toHex(transaction?.maxPriorityFeePerGas) : '0x',
    maxFeePerGas ? toHex(transaction?.maxFeePerGas) : '0x',
    gas ? toHex(transaction?.gas) : '0x',
    transaction?.to ?? '0x',
    value ? toHex(transaction.value) : '0x',
    transaction?.data ?? '0x',
    serializedAccessList,
  ]),
])

// hash Transaction, keccak256 해시 알고리즘 사용
const hashedTransaction = keccak256(serializedTransaction);

// make signature,  secp256k1을 통한 타원 곡선 암호화(ECC) 
const { r, s, recovery } = secp256k1.sign(
  hashedTransaction.slice(2), // hash message
  account.privateKey.slice(2), // privateKey를 노출하면 안되니 클라이언트가 중요
  { lowS: true, extraEntropy: true },
)
  
const signature = {
  r: numberToHex(r, { size: 32 }), // 타원 곡선 점의 x 좌표, r는 32바이트로 고정
  s: numberToHex(s, { size: 32 }), // privateKey와 hashedTransaction을 바탕으로 계산된 값, s는 32바이트로 고정
  v: recovery ? 28n : 27n, // 이더리움 복구 키
  yParity: recovery, // 1 or 0, y좌표의 홀짝 여부
}

// signature와 transaction을 함께 serialized
const r_ = signature.r.trim();
const s_ = signature.s.trim();
const yParity_ = (() => {
  if (typeof yParity === 'number') return yParity ? toHex(1) : '0x';
  if (v === 0n) return '0x';
  if (v === 1n) return toHex(1);
  return v === 27n ? '0x' : toHex(1);
})();
const toYParitySignatureArray = [yParity_, r_ === '0x00' ? '0x' : r_, s_ === '0x00' ? '0x' : s_];

const serializedTransactionWithSignature = concatHex([
  EIP_1559,
  toRlp([
    toHex(mainnet.id),
    nonce ? toHex(transaction?.nonce) : '0x',
    maxPriorityFeePerGas ? toHex(transaction?.maxPriorityFeePerGas) : '0x',
    maxFeePerGas ? toHex(transaction?.maxFeePerGas) : '0x',
    gas ? toHex(transaction?.gas) : '0x',
    transaction?.to ?? '0x',
    value ? toHex(transaction.value) : '0x',
    transaction?.data ?? '0x',
    serializedAccessList,
    ...toYParitySignatureArray,
  ]),
]);

// 트랜잭션 전송
const walletClient = createWalletClient({
  account,
  chain: mainnet,
  transport: http()
});

const hash = walletClient.request(
  {
    method: 'eth_sendRawTransaction',
    params: [serializedTransactionWithSignature],
  },
  { retryCount: 0 },
);

// 트랜잭션 상태 확인
const receipt = await publicClient.waitForTransactionReceipt({ hash });

// Balance 조회
const balance = await publicClient.getBalance({
  address: account.address,
});

// publicKey 기반 signature 검증
// const signatureIsValid = secp256k1.verify(
//   signature,
//   hash.slice(2),
//   account.publicKey.slice(2)
// )