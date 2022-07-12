NEW_VERSION=$(cat version | awk '{$1=$1;print}')

cd relay/server && blocklet version $NEW_VERSION && git add blocklet.yml && cd ../../
echo "bump relay server to version $NEW_VERSION"

cd ux/react && blocklet version $NEW_VERSION && git add blocklet.yml && cd ../../
echo "bump react storybook to version $NEW_VERSION"
