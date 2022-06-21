NEW_VERSION=$(cat version | awk '{$1=$1;print}')

cd apps/asset-chain-api && blocklet version $NEW_VERSION && git add blocklet.yml && cd ../../
echo "bump asset chain api to version $NEW_VERSION"

cd apps/asset-chain && blocklet version $NEW_VERSION && git add blocklet.yml && cd ../../
echo "bump asset chain to version $NEW_VERSION"

cd apps/fs-chain-api && blocklet version $NEW_VERSION && git add blocklet.yml && cd ../../
echo "bump fs chain api to version $NEW_VERSION"

cd apps/fs-chain-manager && blocklet version $NEW_VERSION && git add blocklet.yml && cd ../../
echo "bump fs chain manager to version $NEW_VERSION"

cd apps/qldb-chain-api && blocklet version $NEW_VERSION && git add blocklet.yml && cd ../../
echo "bump qldb chain api to version $NEW_VERSION"

cd apps/qldb-chain-manager && blocklet version $NEW_VERSION && git add blocklet.yml && cd ../../
echo "bump qldb chain manager to version $NEW_VERSION"
