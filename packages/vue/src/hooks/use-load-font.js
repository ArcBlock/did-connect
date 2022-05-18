export default function useLoadFont(font, callback = () => {}, { delay = 3000 } = {}) {
  const start = +new Date();
  function run() {
    requestAnimationFrame(() => {
      const now = +new Date();
      if (now - start <= delay && document?.fonts?.check) {
        if (document.fonts.check(`1rem ${font}`)) {
          callback();
        } else {
          run();
        }
      } else {
        callback();
      }
    });
  }
  if (font) {
    run();
  }
}
