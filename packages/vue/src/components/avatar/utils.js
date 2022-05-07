export function isEthereumDid(did) {
  const address = did.replace('did:abt:', '');
  // check if it has the basic requirements of an address
  if (!/^(0x)?[0-9a-f]{40}$/i.test(address)) {
    return false;
  }
  return true;
}
