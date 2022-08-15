NEW_VERSION=$(cat version | awk '{$1=$1;print}')

cd website/pages && blocklet version $NEW_VERSION && git add blocklet.yml && cd ../../
echo "bump pages to version $NEW_VERSION"

cd website/docs && blocklet version $NEW_VERSION && git add blocklet.yml && cd ../../
echo "bump docs to version $NEW_VERSION"

cd relay/server && blocklet version $NEW_VERSION && git add blocklet.yml && cd ../../
echo "bump relay server to version $NEW_VERSION"

cd ux/react && blocklet version $NEW_VERSION && git add blocklet.yml && cd ../../
echo "bump react storybook to version $NEW_VERSION"
